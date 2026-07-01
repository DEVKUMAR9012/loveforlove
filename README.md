# Relationship Memories & Chat Dashboard

## Project Structure

- backend/
  - models/
    - `Message.js` - MongoDB model for chat messages
    - `Memory.js` - MongoDB model for timeline memories
    - `Letter.js` - MongoDB model for digital letters
  - controllers/  (optional, for request handling logic)
  - routes/       (optional, for API routing)
  - `server.js`   (Express server entrypoint)
  - `package.json`

- frontend/
  - public/
    - `index.html`
  - src/
    - components/
      - `AuthForm.jsx`
      - `TimelineCard.jsx`
      - `LetterCard.jsx`
      - `ChatInsights.jsx`
    - pages/
      - `Dashboard.jsx`
      - `Login.jsx`
      - `Timeline.jsx`
      - `Letters.jsx`
      - `ChatInsights.jsx`
    - `App.jsx`
    - `index.jsx`
    - `tailwind.css`
  - `package.json`
  - `tailwind.config.js`
  - `postcss.config.js`

## Setup Instructions

### 1. Install backend dependencies

```powershell
cd c:\arudev\backend
npm install
```

### 2. Install frontend dependencies

```powershell
cd c:\arudev\frontend
npm install
```

### 3. Configure Firebase Auth

- Create a Firebase project at https://console.firebase.google.com
- Enable Email/Password sign-in (or Google sign-in if you prefer)
- Add a Web app and copy the Firebase config values
- Add your Firebase config to the frontend in a secure file such as `src/firebaseConfig.js`

### 4. Configure MongoDB

- Create a MongoDB Atlas cluster or run a local MongoDB instance
- Create a database, e.g. `relationship-memories`
- Add your connection string to `backend/.env` as `MONGODB_URI`

### 5. Start the backend server

```powershell
cd c:\arudev\backend
npm run dev
```

### 6. Start the frontend app

```powershell
cd c:\arudev\frontend
npm run dev
```

## MongoDB Schemas

- `Message.js`
- `Memory.js`
- `Letter.js`

These files are already created under `backend/models/`.

## Next Step

I can now set up the frontend boilerplate and Firebase auth flow, or wire the backend API endpoints for messages, memories, and letters. Let me know which piece you want first.