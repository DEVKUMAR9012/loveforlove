# Live Location Feature — Phase 1 Implementation Guide

## ✅ What's been built

### **Backend (Node.js/Express)**

#### Models
- **Location.js** — Stores real-time coordinates with GeoJSON 2dsphere indexing
  - Lat/lng, accuracy, battery, speed, heading
  - Auto-expires after 48 hours (TTL index)
  - Tracks `sharingActive` status

- **SafeZone.js** — Geofenced safe locations
  - Home, Office, College, Gym, Custom zones
  - Radius in meters (default 500m)
  - Emoji + custom address labels

#### Services
- **geolocationService.js**
  - Haversine distance calculation
  - Bearing/direction detection
  - Geofence proximity checks
  - Movement status detection

#### Controllers
- **locationController.js**
  - `updateLocation` — Store current position (POST)
  - `getPartnerLocation` — Fetch partner's live position
  - `pauseLocationSharing` — Temporarily stop sharing
  - `resumeLocationSharing` — Resume location broadcast
  - `createSafeZone` — Create geofence zone
  - `getSafeZones` — List all zones
  - `deleteSafeZone` — Remove zone
  - `getDistanceStats` — Monthly distance milestones

#### Routes
- `POST /api/location/update` — Update position
- `GET /api/location/partner` — Get partner's location
- `POST /api/location/pause` — Pause sharing
- `POST /api/location/resume` — Resume sharing
- `POST /api/location/safe-zone` — Create zone
- `GET /api/location/safe-zones` — List zones
- `DELETE /api/location/safe-zone/:zoneId` — Delete zone
- `GET /api/location/distance-stats` — Get stats

#### Socket.io Events
- `location:update` — Broadcast position changes
- `hug:send` / `hug:received` — Send affection gesture
- `arrival:celebrate` — Trigger celebration animation
- `geofence:event` — Zone entered/exited
- `location:user-online/offline` — Connection status

### **Frontend (React + Vite)**

#### Pages
- **LiveLocation.jsx** (pages/)
  - Main map interface with Leaflet
  - Bottom sheet with partner status
  - Real-time distance display
  - Send Hug button
  - Pause/Resume toggle
  - Battery display
  - Last seen timestamp
  - Error handling

#### Components
- **LocationMap.jsx** (components/)
  - Leaflet map with custom emoji markers
  - Safe zone geofence circles
  - Distance polyline between partners
  - Auto-fit bounds to show both users
  - Responsive tile layer

#### Hooks
- **useLocation.js** (hooks/)
  - `useLocation()` — Geolocation.watchPosition wrapper
  - Battery status tracking
  - Permission handling
  - Throttled updates (5sec)
  - useLocationSocket() — Socket.io broadcaster

#### Utilities
- **locationUtils.js** (utils/)
  - Distance calculations (Haversine)
  - Bearing detection
  - Movement status formatter
  - Time-ago display
  - Distance formatting (km/m)

#### Styles
- **LiveLocation.css** — Complete UI styling
  - Map wrapper
  - Bottom sheet with animations
  - Badges & status indicators
  - Responsive mobile layout

#### Integration
- Added to **App.jsx** — `/location` route
- Added to **Sidebar.jsx** — Navigation link with icon

---

## 🚀 Deployment Steps

### **1. Install Dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### **2. Database Setup**

Ensure MongoDB is running. The models will auto-create collections, but verify indexes:

```javascript
// Optional: Run in MongoDB shell to verify
db.locations.createIndex({ "geometry": "2dsphere" })
db.locations.createIndex({ "userId": 1, "createdAt": -1 })
db.safezones.createIndex({ "geometry": "2dsphere" })
db.safezones.createIndex({ "userId": 1 })
```

### **3. Environment Variables**

Add to `.env` (backend):

```env
# Existing vars
NODE_ENV=development
PORT=4000
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/loveforlove

# Optional: For reverse geocoding (Phase 2)
OPENCAGE_API_KEY=your_opencage_key
```

### **4. Update Server**

The Socket.io setup is already integrated in `server.js`. Just ensure:
- Line 7: `const { Server } = require('socket.io');` is present
- Line 23: `const locationRoutes = require('./routes/location');` is imported
- Line 70: `app.use('/api/location', locationRoutes);` is added
- Lines 80–160: Socket.io initialization is complete

### **5. Start Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Both will auto-reload on file changes.

---

## 🧪 Testing Locally

### **Test Flow**

1. **Open two browser windows** (or two devices on same network)
2. **Login as partners** in each window
3. **Open `/location` route** in both

### **Feature Tests**

- ✅ **Live dot**: Both markers appear and update in real-time
- ✅ **Distance**: Shows live km calculation
- ✅ **Send hug**: Button emits event, partner sees animation
- ✅ **Pause/Resume**: Toggle stops/starts location broadcast
- ✅ **Battery display**: Shows % on partner card
- ✅ **Last seen**: Updates when sharing paused
- ✅ **Mobile responsive**: Try on phone/tablet simulator

### **Console Debugging**

Open DevTools → Console:

```javascript
// Check if socket is connected
console.log(socket.connected)

// Listen for location events
socket.on('location:update', (data) => console.log('Location:', data))
```

---

## 🔧 Configuration (Optional Phase 2)

### **Adjust Throttling**

In `useLocation.js`, line ~60:
```javascript
if (now - lastUpdateRef.current < 5000) return; // 5 seconds
```

Change `5000` to desired ms (e.g., `10000` for 10 sec to save battery).

### **Change Arrival Distance Threshold**

In `LiveLocation.jsx`, line ~140:
```javascript
if (dist < 0.5 && arrivalTimeoutRef.current === null) { // 500m
```

Change `0.5` to any distance in km (e.g., `1` for 1km).

### **Safe Zone Radius Default**

In `locationController.js`:
```javascript
radiusMeters: radiusMeters || 500, // Default 500m
```

---

## 📊 Performance Notes

- **Location updates**: Throttled to 5–10 sec (configurable)
- **Socket events**: Broadcast to couple's room only (efficient)
- **Database**: TTL index auto-deletes 48hr-old data
- **Map rendering**: Leaflet is lightweight (~40KB gzipped)
- **Battery impact**: High-accuracy mode; can be reduced if needed

---

## 🐛 Known Limitations (Phase 1)

❌ No reverse geocoding (shows "Location detected" instead of "Sadar Bazaar")
❌ No ETA calculation (Google Directions API needs integration)
❌ No movement trail history (Phase 3)
❌ No safe zone notifications on enter/exit (needs backend event)

---

## 📱 Phase 2 + 3 Roadmap

**Phase 2:**
- [ ] Safe zone enter/exit notifications
- [ ] ETA auto-calculation (Google Directions)
- [ ] Reverse geocoding for addresses
- [ ] Distance milestones tracker

**Phase 3:**
- [ ] Movement trail polyline history
- [ ] Heart pins for memory locations
- [ ] Route heatmap (visited spots)
- [ ] Weekly/monthly stats dashboard

---

## 🔐 Privacy & Security

✅ **Explicit consent**: Both must enable location sharing
✅ **Paused state**: Clearly visible on both screens
✅ **Auto-delete**: 48hr TTL on location history
✅ **Auth required**: All endpoints verify JWT token
✅ **Socket auth**: JWT verified before Socket.io connection
✅ **Room isolation**: Each couple in their own Socket room

---

## 🎨 Customization

### Change Colors/Gradient

**LiveLocation.jsx**, line 20:
```javascript
background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
```

Replace hex codes with your palette.

### Emoji Markers

**LocationMap.jsx**, line ~90:
```javascript
<span>${emoji}</span> // Change emoji here
```

### Button Labels

**LiveLocation.jsx**, line ~260:
```javascript
🤗 Send Hug  // Change text/emoji
```

---

## 💬 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Location permission denied" | Clear browser data & reload, or check Settings → Privacy |
| Socket not connecting | Check JWT token is valid, verify CORS origins in server.js |
| Map not rendering | Ensure Leaflet CSS is imported, check console for errors |
| Lat/lng reversed on map | Check GeoJSON format: `[longitude, latitude]` |
| No haptic feedback | Browser might not support vibration API (not critical) |

---

## Next Steps

1. **Test locally** with two devices
2. **Deploy backend** to Railway/Render
3. **Deploy frontend** to Vercel
4. **Test on production** with real devices
5. **Collect feedback** from partners
6. **Plan Phase 2** features

---

📍 Happy tracking! 💛
