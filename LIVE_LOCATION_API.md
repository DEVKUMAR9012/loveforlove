# Live Location API Reference

## REST Endpoints

### Update Location
```http
POST /api/location/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "accuracy": 25,
  "battery": 75,
  "speed": 5.2,
  "heading": 180
}

Response 200:
{
  "message": "Location updated",
  "location": {
    "id": "507f1f77bcf86cd799439011",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "battery": 75,
    "speed": 5.2
  }
}
```

### Get Partner's Location
```http
GET /api/location/partner
Authorization: Bearer {token}

Response 200:
{
  "partnerId": "507f1f77bcf86cd799439012",
  "location": {
    "latitude": 28.7100,
    "longitude": 77.1200,
    "accuracy": 20,
    "battery": 85,
    "speed": 3.5,
    "heading": 90,
    "address": null,
    "lastUpdated": "2026-07-16T10:30:00.000Z",
    "sharingActive": true
  },
  "distanceKm": 1.2
}
```

### Pause Location Sharing
```http
POST /api/location/pause
Authorization: Bearer {token}

Response 200:
{
  "message": "Location sharing paused",
  "sharingActive": false
}
```

### Resume Location Sharing
```http
POST /api/location/resume
Authorization: Bearer {token}

Response 200:
{
  "message": "Location sharing resumed",
  "sharingActive": true
}
```

### Create Safe Zone
```http
POST /api/location/safe-zone
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Home",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "radiusMeters": 500,
  "address": "My Home, Delhi"
}

Response 200:
{
  "message": "Safe zone created",
  "safeZone": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Home",
    "emoji": "🏠",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "radiusMeters": 500
  }
}
```

### Get All Safe Zones
```http
GET /api/location/safe-zones
Authorization: Bearer {token}

Response 200:
{
  "safeZones": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Home",
      "emoji": "🏠",
      "latitude": 28.7041,
      "longitude": 77.1025,
      "radiusMeters": 500,
      "address": "My Home, Delhi",
      "notificationsEnabled": true
    }
  ]
}
```

### Delete Safe Zone
```http
DELETE /api/location/safe-zone/{zoneId}
Authorization: Bearer {token}

Response 200:
{
  "message": "Safe zone deleted"
}
```

### Get Distance Statistics
```http
GET /api/location/distance-stats
Authorization: Bearer {token}

Response 200:
{
  "totalDistanceApartKm": 1245,
  "meetingsThisMonth": 12,
  "period": "30 days"
}
```

---

## Socket.io Events

### Connection
```javascript
// Client connects with auth token
const socket = io('http://localhost:4000', {
  auth: { token: 'your_jwt_token' }
});

// Server accepts if token valid
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Location Update (Broadcast)
```javascript
// Client emits location
socket.emit('location:update', {
  latitude: 28.7041,
  longitude: 77.1025,
  accuracy: 25,
  battery: 75,
  speed: 5.2,
  heading: 180
});

// Partner receives in same room
socket.on('location:update', (data) => {
  console.log('Partner moved to:', data.latitude, data.longitude);
});
```

### Send a Hug
```javascript
// Client sends hug
socket.emit('hug:send', {});

// Partner receives
socket.on('hug:received', (data) => {
  console.log('Partner sent a hug at', data.timestamp);
  // Trigger animation, haptic feedback
});
```

### Arrival Celebration
```javascript
// Server detects arrival (distance < 500m)
// Both clients receive
socket.on('arrival:celebrate', (data) => {
  console.log('Arrival! Celebrate!');
  // Trigger confetti animation
});
```

### Geofence Events
```javascript
// Client detects zone entry/exit
socket.emit('geofence:event', {
  zoneId: '507f1f77bcf86cd799439013',
  zoneName: 'Home',
  eventType: 'enter' // or 'exit'
});

// Partner receives notification
socket.on('geofence:event', (data) => {
  console.log(`Partner ${data.eventType}ed ${data.zoneName}`);
  // Show toast: "She arrived home safely 💚"
});
```

### Online/Offline Status
```javascript
// When user connects
socket.on('location:user-online', (data) => {
  console.log('Partner came online:', data.userId);
});

// When user disconnects
socket.on('location:user-offline', (data) => {
  console.log('Partner went offline:', data.userId);
});
```

---

## Frontend Integration

### Basic Usage
```jsx
import { useLocation, useLocationSocket } from '../hooks/useLocation';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

export function MyComponent() {
  const { user, token } = useAuth();
  const { location, battery, startWatching, stopWatching } = useLocation();
  const [socket, setSocket] = useState(null);

  // Setup socket
  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      auth: { token }
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, [token]);

  // Start watching position
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  // Broadcast location to partner
  useLocationSocket(socket, location, battery);

  // Listen for partner events
  useEffect(() => {
    if (!socket) return;

    socket.on('hug:received', () => {
      // Show animation
    });

    socket.on('arrival:celebrate', () => {
      // Show confetti
    });
  }, [socket]);

  return (
    <div>
      <p>My location: {location?.latitude}, {location?.longitude}</p>
      <p>Battery: {battery}%</p>
    </div>
  );
}
```

### Utilities
```javascript
import {
  calculateDistance,
  formatDistance,
  getMovementStatus,
  getTimeAgo,
} from '../utils/locationUtils';

// Calculate distance in km
const distKm = calculateDistance(lat1, lng1, lat2, lng2);

// Format for display: "2.4 km" or "240 m"
const display = formatDistance(distKm);

// Get movement status: "🚗 Driving"
const status = getMovementStatus(speedMs);

// Get time ago: "5m ago"
const when = getTimeAgo(date);
```

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "errors": [
    {
      "msg": "Invalid latitude",
      "param": "latitude",
      "location": "body"
    }
  ]
}
```

**404 Not Found**
```json
{
  "message": "Partner not sharing location"
}
```

**500 Internal Server Error**
```json
{
  "message": "Failed to update location",
  "error": "Database error details..."
}
```

### Socket Auth Errors
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // "Authentication failed"
  // "Invalid token"
});
```

---

## Data Models

### Location Document
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // User who owns this location
  geometry: {
    type: "Point",
    coordinates: [77.1025, 28.7041] // [lon, lat]
  },
  latitude: 28.7041,
  longitude: 77.1025,
  accuracy: 25,               // meters
  battery: 75,                // 0-100
  speed: 5.2,                 // m/s
  heading: 180,               // degrees 0-360
  address: null,              // For future reverse geocoding
  sharingActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
  // Expires after 48 hours (TTL index)
}
```

### SafeZone Document
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: "Home",               // Home|Office|College|Gym|Friend|Custom
  geometry: {
    type: "Point",
    coordinates: [77.1025, 28.7041]
  },
  latitude: 28.7041,
  longitude: 77.1025,
  radiusMeters: 500,
  address: "My Home, Delhi",
  notificationsEnabled: true,
  emoji: "🏠",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## Rate Limiting

All `/api/location` endpoints are subject to:
- **Global rate limit**: 200 requests/minute per IP
- **Location update**: Recommend throttle to 5–10 seconds client-side

---

## Security Notes

✅ All endpoints require valid JWT token
✅ Socket.io connection requires token auth
✅ Users can only access their own location data
✅ Location history auto-deletes after 48 hours
✅ CORS whitelist enforced server-side

---

## Testing with cURL

```bash
# Get partner location
curl -X GET http://localhost:4000/api/location/partner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update location
curl -X POST http://localhost:4000/api/location/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025,
    "accuracy": 25,
    "battery": 75,
    "speed": 5.2,
    "heading": 180
  }'

# Create safe zone
curl -X POST http://localhost:4000/api/location/safe-zone \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "radiusMeters": 500
  }'
```

---

Last updated: 2026-07-16
