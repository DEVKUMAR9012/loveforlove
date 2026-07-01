# Our Universe

> 🌌 A private universe for two — built with React, Vite, Tailwind CSS, Framer Motion & Firebase.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
```bash
cp .env.example .env
```
Fill in your Firebase credentials in `.env`.

> Get values from: [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Web App

### 3. Start Dev Server
```bash
npm run dev
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + Vite |
| Styling | Tailwind CSS 3 |
| Animations | Framer Motion |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| Presence | Firebase Realtime Database |
| State | Zustand |
| Routing | React Router v6 |

## 📁 Project Structure

```
src/
├── components/     # Shared UI (GlassCard, Navbar, etc.)
├── features/       # Feature modules (auth, dashboard, gallery…)
├── hooks/          # Custom React hooks
├── lib/            # Firebase config + helpers
├── pages/          # Top-level route pages
├── router/         # React Router config
├── store/          # Zustand global state
└── styles/         # globals.css (design system)
```

## 🌈 Feature Phases

| Phase | Feature | Status |
|---|---|---|
| 1 | Setup & Design System | ✅ Done |
| 2 | Authentication + Couple Pairing | 🔲 Next |
| 3 | Dashboard | 🔲 Upcoming |
| 4 | Timeline | 🔲 Upcoming |
| 5 | Gallery | 🔲 Upcoming |
| 6 | Love Letters + Voice Notes | 🔲 Upcoming |
| 7 | Future Goals + Deploy | 🔲 Upcoming |

## 🎨 Design System

- **Pink:** `#FF6B9D → #C850C0`
- **Blue:** `#4FACFE → #00F2FE`
- **Dark Base:** `#0D0D1A`
- **Glass:** `backdrop-blur(20px)` + `rgba(255,255,255,0.06)` bg
- **Font:** Quicksand + DM Sans
