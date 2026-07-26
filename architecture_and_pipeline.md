# 🏗️ loveforlove Architecture & Data Pipeline Visualization

This document details the complete end-to-end architecture, authentication flow, data storage pipeline, deployment structure, and **security architecture** for the **loveforlove** application.

---

## 1. System Overview Architecture

```mermaid
graph TD
    subgraph Client ["💻 Client Layer (Frontend)"]
        ReactApp["Vite + React SPA"]
        AuthCtx["AuthContext State"]
        LocalStorage["Local Storage (Access Token)"]
        HttpCookie["HttpOnly Cookie (Refresh Token)"]
    end

    subgraph AuthLayer ["🔐 External Auth Providers"]
        Firebase["Firebase Auth Service"]
        MetaOAuth["Meta / Facebook Developer Platform"]
    end

    subgraph Backend ["⚙️ Server Layer (Node.js + Express)"]
        ExpressApp["Express API Server"]
        AuthRoutes["Auth Routes (/api/auth)"]
        Middleware["JWT & Security Middleware"]
        AdminSDK["Firebase Admin SDK"]
    end

    subgraph Storage ["💾 Data & Media Storage"]
        MongoDB[("MongoDB Database")]
        Cloudinary["Cloudinary CDN (Media Uploads)"]
    end

    ReactApp --> AuthCtx
    ReactApp -- "1. Social Login Request" --> Firebase
    Firebase <--> MetaOAuth
    ReactApp -- "2. ID Token + Profile" --> AuthRoutes
    AuthRoutes -- "3. Verify Token" --> AdminSDK
    AdminSDK <--> Firebase
    AuthRoutes -- "4. Store / Update User" --> MongoDB
    AuthRoutes -- "5. Return JWT & HttpOnly Cookie" --> ReactApp
    ReactApp -- "Upload Snaps/Voice" --> Cloudinary
```

---

## 2. Authentication & OAuth Pipeline

Here is the exact step-by-step pipeline for how **Social Login (Google / Facebook / Instagram)** works:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React App (Frontend)
    participant FB as Firebase / Meta OAuth
    participant Backend as Express Backend
    participant DB as MongoDB Database

    User->>Frontend: Clicks "Continue with Facebook / Instagram"
    Frontend->>FB: Triggers signInWithPopup(auth, facebookProvider)
    FB->>User: Opens Meta login popup modal
    User->>FB: Authenticates & grants public_profile permission
    FB-->>Frontend: Returns Firebase User, ID Token, displayName, & photoURL
    Frontend->>Backend: POST /api/auth/social { token, firebaseUid, name, email, avatarUrl }
    Backend->>Backend: Verifies Firebase ID Token (Firebase Admin SDK)
    Backend->>DB: Searches user by firebaseUid or email
    alt User exists
        Backend->>DB: Updates user with latest name & high-res profile picture
    else New User
        Backend->>DB: Creates new User document with firebaseUid & avatarUrl
    end
    Backend-->>Frontend: Sets HttpOnly refreshToken cookie & returns short-lived accessToken
    Frontend->>Frontend: Stores accessToken in localStorage & updates AuthContext
    Frontend->>User: Redirects user to Dashboard
```

---

## 3. 🛡️ Security Architecture & Protections

Here is a breakdown of all 6 layers of security built into **loveforlove**:

### 🔒 1. Cryptographic Token Verification (Anti-Spoofing)
- When a user logs in via Facebook/Instagram, the frontend receives an ID Token cryptographically signed by Firebase/Google.
- The backend uses `firebase-admin` SDK (`getAuth().verifyIdToken(token)`) to verify the token's RSA signature against Google's public keys.
- **Protection**: Attackers cannot fake or tamper with login payloads; any modified token is immediately rejected with `401 Unauthorized`.

### 🛡️ 2. Dual-Token JWT Architecture (Short-Lived Access + Long-Lived Refresh)
- **Access Token**: Short-lived (15 minutes). Used for API authorization header (`Authorization: Bearer <token>`).
- **Refresh Token**: Long-lived (30 days). Used solely to get a new access token via `/api/auth/refresh`.
- **Protection**: If an access token is intercepted, it becomes completely useless after 15 minutes.

### 🍪 3. HttpOnly & SameSite=Strict Cookies (XSS & CSRF Immune)
- The 30-day Refresh Token is stored as an **HttpOnly Cookie**.
- **XSS Protection**: `httpOnly: true` means client-side JavaScript (including browser extensions or injected scripts) **cannot read or steal** the token via `document.cookie`.
- **CSRF Protection**: `sameSite: 'strict'` prevents cross-site request forgery by ensuring browser never sends the cookie on third-party site requests.

### 🔑 4. SHA-256 Database Token Hashing (Zero Plaintext Tokens)
- Refresh tokens are **never stored in plain text** in the MongoDB database.
- Before saving to MongoDB, tokens are hashed using SHA-256 (`crypto.createHash('sha256').update(token).digest('hex')`).
- **Protection**: Even if an attacker gets full read access to the MongoDB database, they cannot use the hashed tokens to authenticate.

### 🔐 5. Bcrypt Password Hashing & Cryptographic Random Salts
- Standard user passwords are hashed using **Bcrypt with 12 salt rounds**.
- Social accounts generate a 40-character cryptographically random password (`crypto.randomBytes(20).toString('hex')`) so social accounts cannot be accessed via password endpoints.

### 🛑 6. Rate Limiting & Brute-Force Defense
- Custom rate limiters restrict authentication attempts:
  - `loginLimiter`: Max 5 failed login attempts per 15-minute window.
  - `registerLimiter`: Prevents automated account creation bots.
  - `refreshLimiter`: Prevents refresh token enumeration.

---

## 4. Security Flow Diagram

```mermaid
flowchart TD
    Req["Incoming API Request"] --> RateLimit{"Passes Rate Limiter?"}
    RateLimit -- No --> R429["429 Too Many Requests"]
    RateLimit -- Yes --> CheckAuth{"Has Valid JWT Access Token?"}
    
    CheckAuth -- Valid (Expired < 15m) --> Controller["Execute Controller / Access DB"]
    
    CheckAuth -- Expired / Invalid --> CheckCookie{"Has Valid HttpOnly Refresh Cookie?"}
    
    CheckCookie -- No --> R401["401 Unauthorized (Redirect to /login)"]
    CheckCookie -- Yes --> HashCheck{"SHA-256 Match in MongoDB?"}
    
    HashCheck -- Match Found --> Rotate["Rotate Tokens (Issue New Access Token & New Cookie)"]
    Rotate --> Controller
    HashCheck -- No Match (Stolen/Old Token) --> Revoke["Revoke All Sessions & Return 403"]
```
