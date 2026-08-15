# 💖 loveforlove — A Private World, Built for Two

![loveforlove](https://img.shields.io/badge/Status-Active-rose?style=for-the-badge&logo=heart)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=for-the-badge&logo=vite)
![NodeJS](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Leaflet](https://img.shields.io/badge/Map-CartoDB_Dark-199900?style=for-the-badge&logo=leaflet)

> **loveforlove** is a secure, ad-free private web application designed to help two people stay connected, share real-time live location, track daily moods, send voice notes, and preserve everlasting memories together.

---

## 🎬 Demo Video

https://github.com/DEVKUMAR9012/loveforlove/raw/main/ss/demo.mp4

---

## 📸 App Showcase

| 🏠 Home Dashboard | 🗺️ Live Location (Dark Map) |
| :---: | :---: |
| ![Home Dashboard](ss/cropped/Screenshot%202026-07-24%20012853.png) | ![Live Location Dark Map](ss/cropped/Screenshot%202026-07-23%20234455.png) |
| *Personalized home with partner connection & quick access* | *Real-time location, battery status, speed & neon path* |

| 📸 Shared Photo Gallery | 🎭 Mood Tracker & Daily Check-ins |
| :---: | :---: |
| ![Memories Gallery](ss/cropped/Screenshot%202026-07-23%20233209.png) | ![Mood Tracker](ss/cropped/Screenshot%202026-07-23%20233230.png) |
| *Private photo journal and memory vault* | *Track daily emotional check-ins & mood history* |

| 🎙️ Voice Notes & Audio Messages | 🗓️ Shared Calendar & Special Days |
| :---: | :---: |
| ![Voice Notes](ss/cropped/Screenshot%202026-07-23%20233241.png) | ![Shared Calendar](ss/cropped/Screenshot%202026-07-24%20013020.png) |
| *Record & replay heartwarming voice messages* | *Important dates, countdowns & shared reminders* |

| 🗺️ Live Map (Fullscreen) |
| :---: |
| ![Live Map Fullscreen](ss/cropped/Screenshot%202026-07-24%20013033.png) |
| *Full dark map view with live partner tracking* |

---

## ✨ Key Features

- 🗺️ **Snapchat Dark Mode Live Location**: Real-time Leaflet map powered by CartoDB Dark Matter dark tiles, vibrant neon cyan & pink markers, live movement trails, battery indicators, and distance tracking.
- 🔑 **Partner Code Direct Sign-In**: Login instantly using an 8-character partner invite code without providing an email address. Add or update email anytime in Settings.
- 💌 **Shareable Invite Cards**: Generate romantic shareable partner invite cards with 1-tap WhatsApp sharing, native Web Share API integration, and direct join links.
- 📸 **Memories & Disappearing Snaps**: Create permanent photo memory journals or send temporary disappearing snaps.
- 🎙️ **Voice Notes**: Record, send, and replay audio messages for your partner to wake up to.
- 🗓️ **Milestones & Shared Calendar**: Track relationship anniversary days, plan date nights, and set recurring reminders.
- 🛡️ **Admin Approval Disconnection & Data Purge**: Request to break connection with a reason for admin review. Once approved by website admin, unlinks partner accounts and permanently purges all shared relationship data.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Leaflet.js, React Icons, Socket.io Client
- **Backend**: Node.js, Express.js, Socket.io, MongoDB with Mongoose, JWT Authentication, Multer & Cloudinary
- **Database**: MongoDB Atlas / Local MongoDB

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or MongoDB Atlas URI)

### 1. Clone the repository

```bash
git clone https://github.com/DEVKUMAR9012/loveforlove.git
cd loveforlove
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/loveforlove
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Run the backend server:

```bash
npm run dev
```

The backend server runs at `http://localhost:4000`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
```

Run the frontend development server:

```bash
npm run dev
```

The frontend application runs at `http://localhost:5173`.

---

## 📂 Project Structure

```
loveforlove/
├── backend/
│   ├── middleware/        # Auth, rate limiters, admin guard
│   ├── models/            # Mongoose schemas (User, Message, Memory, Snap, Location, Report, etc.)
│   ├── routes/            # Express routes (auth, settings, admin, location, memories, etc.)
│   ├── server.js          # Express & Socket.io server entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── ss/            # App showcase screenshot assets
│   ├── src/
│   │   ├── components/    # Reusable UI components (LocationMap, MainLogo, Layout, etc.)
│   │   ├── context/       # AuthContext & State management
│   │   ├── pages/         # Application pages (LiveLocation, Settings, About, Login, Invite, AdminDashboard)
│   │   └── App.jsx        # Main router & app entry point
│   └── package.json
├── ss/                    # Showcase screenshots
└── README.md
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).