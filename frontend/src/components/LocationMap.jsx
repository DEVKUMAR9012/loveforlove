import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function LocationMap({
  myLocation,
  partnerLocation,
  safeZones,
  user,
  partner,
  myTrail = [],
  partnerTrail = [],
  sharingActive = true,
  partnerSharingActive = true,
  memoryPins = [],
  onMapReady,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const myMarkerRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const myAccuracyRef = useRef(null);
  const myTrailRef = useRef(null);
  const partnerTrailRef = useRef(null);
  const connectionLineRef = useRef(null);
  const safeZonesLayerRef = useRef(null);
  const memoryPinsLayerRef = useRef(null);

  const [showTrails, setShowTrails] = useState(false);

  // Animation state tracking
  const animationsRef = useRef({
    myMarker: { frameId: null, startTime: null, from: null, target: null },
    partnerMarker: { frameId: null, startTime: null, from: null, target: null },
  });

  // History state for activity calculation
  const historyRef = useRef({
    myLocation: null,
    partnerLocation: null,
  });

  // Timer for recalculating recency rings
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const center = toLatLng(myLocation) || toLatLng(partnerLocation) || [28.7041, 77.1025];

      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      safeZonesLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      memoryPinsLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);

      window.setTimeout(() => mapInstanceRef.current?.invalidateSize(), 0);
      onMapReady?.(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    const myLatLng = toLatLng(myLocation);
    const partnerActualLatLng = toLatLng(partnerLocation);
    const partnerLatLng = getPartnerDisplayLatLng(myLatLng, partnerActualLatLng);
    const visibleMarkers = [];

    // Calculate Activity and Age
    const myActivity = updateAndGetActivity('myLocation', myLocation, historyRef);
    const partnerActivity = updateAndGetActivity('partnerLocation', partnerLocation, historyRef);

    const myAgeSecs = myLocation ? getAgeInSeconds(myLocation, nowTime) : 0;
    const partnerAgeSecs = partnerLocation ? getAgeInSeconds(partnerLocation, nowTime) : 0;

    if (myLatLng) {
      const myIcon = createAvatarIcon({
        avatarUrl: user?.avatarUrl,
        label: 'You',
        borderColor: '#0ea5e9',
        isLive: sharingActive,
        isDimmed: !sharingActive,
        activity: myActivity,
        ageSecs: myAgeSecs,
      });

      if (myMarkerRef.current) {
        myMarkerRef.current.setIcon(myIcon);
        animateMarker('myMarker', myMarkerRef.current, myLatLng, mapInstanceRef.current);
      } else {
        myMarkerRef.current = L.marker(myLatLng, {
          icon: myIcon,
          zIndexOffset: 1100,
        }).addTo(map);
      }

      visibleMarkers.push(myMarkerRef.current);

      const accuracyRadius = Math.max(20, Number(myLocation?.accuracy) || 40);
      if (myAccuracyRef.current) {
        myAccuracyRef.current.setLatLng(myLatLng);
        myAccuracyRef.current.setRadius(accuracyRadius);
      } else {
        myAccuracyRef.current = L.circle(myLatLng, {
          radius: accuracyRadius,
          color: '#0ea5e9',
          weight: 1,
          opacity: 0.35,
          fillOpacity: 0.08,
        }).addTo(map);
      }
    }

    if (partnerLatLng) {
      const partnerIcon = createAvatarIcon({
        avatarUrl: partner?.avatarUrl,
        label: partner?.name || 'Partner',
        borderColor: '#ee2a7b',
        isLive: partnerSharingActive,
        isDimmed: !partnerSharingActive,
        activity: partnerActivity,
        ageSecs: partnerAgeSecs,
      });

      if (partnerMarkerRef.current) {
        partnerMarkerRef.current.setIcon(partnerIcon);
        animateMarker('partnerMarker', partnerMarkerRef.current, partnerLatLng, mapInstanceRef.current);
      } else {
        partnerMarkerRef.current = L.marker(partnerLatLng, {
          icon: partnerIcon,
          zIndexOffset: 1200,
        }).addTo(map);
      }

      visibleMarkers.push(partnerMarkerRef.current);
    }

    updateConnectionLine(map, connectionLineRef, myLatLng, partnerLatLng, sharingActive && partnerSharingActive);
    updateTrails(map, myTrailRef, partnerTrailRef, myTrail, partnerTrail, partnerSharingActive, showTrails);
    updateSafeZones(safeZonesLayerRef.current, safeZones);
    updateMemoryPins(memoryPinsLayerRef.current, memoryPins);

    if (visibleMarkers.length > 1) {
      const group = L.featureGroup(visibleMarkers);
      map.fitBounds(group.getBounds().pad(0.2), {
        maxZoom: 15,
        animate: true,
        duration: 0.7,
      });
    } else if (visibleMarkers.length === 1) {
      map.setView(visibleMarkers[0].getLatLng(), Math.max(map.getZoom(), 14), {
        animate: true,
      });
    }

    window.setTimeout(() => map.invalidateSize(), 0);
  }, [
    memoryPins,
    myLocation,
    onMapReady,
    partner,
    partnerLocation,
    partnerSharingActive,
    myTrail,
    partnerTrail,
    showTrails,
    safeZones,
    sharingActive,
    user,
    nowTime,
  ]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationsRef.current.myMarker.frameId) cancelAnimationFrame(animationsRef.current.myMarker.frameId);
      if (animationsRef.current.partnerMarker.frameId) cancelAnimationFrame(animationsRef.current.partnerMarker.frameId);
    };
  }, []);

  // Animation helper
  const animateMarker = (markerType, markerRef, targetLatLng, map) => {
    const animState = animationsRef.current[markerType];
    
    // Check if we are already at the target
    const currentPos = markerRef.getLatLng();
    if (currentPos.lat === targetLatLng[0] && currentPos.lng === targetLatLng[1]) return;

    if (animState.frameId) {
      cancelAnimationFrame(animState.frameId);
    }

    animState.from = [currentPos.lat, currentPos.lng];
    animState.target = targetLatLng;
    animState.startTime = performance.now();

    const duration = 1200; // ms

    const animate = (time) => {
      let progress = (time - animState.startTime) / duration;
      if (progress > 1) progress = 1;

      // Easing function: easeOutCubic for smoother stop
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const newPos = interpolatePosition(animState.from, animState.target, easeProgress);
      markerRef.setLatLng(newPos);

      // Also update connection line and accuracy circle during animation
      if (markerType === 'myMarker' && myAccuracyRef.current) {
        myAccuracyRef.current.setLatLng(newPos);
      }

      if (myMarkerRef.current && partnerMarkerRef.current) {
        updateConnectionLine(
          map,
          connectionLineRef,
          [myMarkerRef.current.getLatLng().lat, myMarkerRef.current.getLatLng().lng],
          [partnerMarkerRef.current.getLatLng().lat, partnerMarkerRef.current.getLatLng().lng],
          sharingActive && partnerSharingActive
        );
      }

      if (progress < 1) {
        animState.frameId = requestAnimationFrame(animate);
      } else {
        animState.frameId = null;
      }
    };

    animState.frameId = requestAnimationFrame(animate);
  };

  return (
    <div className="location-map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} className="location-map" style={{ width: '100%', height: '100%', zIndex: 1 }} />
      
      {/* Trails Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTrails((prev) => !prev);
        }}
        className={`trails-toggle-btn ${showTrails ? 'is-active' : ''}`}
        title="Toggle Location Trails"
        aria-label="Toggle Location Trails"
        style={{
          position: 'absolute',
          top: '80px',
          right: '10px',
          zIndex: 1000,
          background: showTrails ? '#0ea5e9' : 'white',
          color: showTrails ? 'white' : '#334155',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '4px',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 5px rgba(0,0,0,0.65)'
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </button>
    </div>
  );
}

function updateAndGetActivity(key, loc, historyRef) {
  if (!loc) return 'stationary';
  const prev = historyRef.current[key];
  
  if (!prev || prev.latitude !== loc.latitude || prev.longitude !== loc.longitude) {
    const activity = calculateActivity(prev, loc);
    historyRef.current[key] = { ...loc, computedActivity: activity };
    return activity;
  }
  
  return prev.computedActivity || 'stationary';
}

function getAgeInSeconds(loc, nowTime) {
  const ts = loc.lastUpdated || loc.timestamp || loc.updatedAt;
  if (!ts) return 0;
  return Math.max(0, (nowTime - new Date(ts).getTime()) / 1000);
}

function calculateActivity(prev, curr) {
  if (!prev) return 'stationary';
  
  const prevTime = new Date(prev.lastUpdated || prev.timestamp || prev.updatedAt).getTime();
  const currTime = new Date(curr.lastUpdated || curr.timestamp || curr.updatedAt).getTime();
  const timeDiffSecs = (currTime - prevTime) / 1000;
  
  // If time difference is zero, negative, or suspiciously long (e.g. 15 mins), fallback
  if (timeDiffSecs <= 0 || timeDiffSecs > 900) return 'stationary';
  
  const distanceKm = haversineDistance(
    Number(prev.latitude), Number(prev.longitude),
    Number(curr.latitude), Number(curr.longitude)
  );
  
  const speedKmH = (distanceKm / timeDiffSecs) * 3600;
  
  if (speedKmH < 1) return 'stationary';
  if (speedKmH <= 7) return 'walking';
  if (speedKmH <= 25) return 'moving';
  return 'driving';
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function interpolatePosition(from, to, progress) {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];
}

function toLatLng(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return [latitude, longitude];
}

function getPartnerDisplayLatLng(myLatLng, partnerLatLng) {
  if (!myLatLng || !partnerLatLng) return partnerLatLng;

  const latDiff = Math.abs(myLatLng[0] - partnerLatLng[0]);
  const lngDiff = Math.abs(myLatLng[1] - partnerLatLng[1]);

  if (latDiff < 0.00008 && lngDiff < 0.00008) {
    return [partnerLatLng[0] + 0.00011, partnerLatLng[1] + 0.00011];
  }

  return partnerLatLng;
}

function normalizeTrail(points) {
  return points
    .map((point) => {
      if (Array.isArray(point)) return point;
      return toLatLng(point);
    })
    .filter(Boolean);
}

function updateConnectionLine(map, lineRef, myLatLng, partnerLatLng, isActive) {
  if (!myLatLng || !partnerLatLng) {
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    return;
  }

  const latLngs = [myLatLng, partnerLatLng];
  const options = {
    color: isActive ? '#f97316' : '#94a3b8',
    weight: 3,
    opacity: isActive ? 0.55 : 0.35,
    dashArray: '8, 10',
    lineCap: 'round',
    lineJoin: 'round',
  };

  if (lineRef.current) {
    lineRef.current.setLatLngs(latLngs);
    lineRef.current.setStyle(options);
  } else {
    lineRef.current = L.polyline(latLngs, options).addTo(map);
  }
}

function updateTrails(map, myTrailRef, partnerTrailRef, myTrail, partnerTrail, partnerSharingActive, showTrails) {
  // My Trail
  const myTrailLatLngs = normalizeTrail(myTrail);
  if (!showTrails || myTrailLatLngs.length < 2) {
    if (myTrailRef.current) {
      map.removeLayer(myTrailRef.current);
      myTrailRef.current = null;
    }
  } else {
    const myOptions = {
      color: '#0ea5e9', // Sky blue to match You marker
      weight: 3,
      opacity: 0.5,
      dashArray: '5, 8',
      lineJoin: 'round',
    };
    if (myTrailRef.current) {
      myTrailRef.current.setLatLngs(myTrailLatLngs);
      myTrailRef.current.setStyle(myOptions);
    } else {
      myTrailRef.current = L.polyline(myTrailLatLngs, myOptions).addTo(map);
    }
  }

  // Partner Trail
  const partnerTrailLatLngs = normalizeTrail(partnerTrail);
  if (!showTrails || partnerTrailLatLngs.length < 2) {
    if (partnerTrailRef.current) {
      map.removeLayer(partnerTrailRef.current);
      partnerTrailRef.current = null;
    }
  } else {
    const partnerOptions = {
      color: partnerSharingActive ? '#ee2a7b' : '#94a3b8',
      weight: 3,
      opacity: partnerSharingActive ? 0.5 : 0.28,
      dashArray: '5, 8',
      lineJoin: 'round',
    };
    if (partnerTrailRef.current) {
      partnerTrailRef.current.setLatLngs(partnerTrailLatLngs);
      partnerTrailRef.current.setStyle(partnerOptions);
    } else {
      partnerTrailRef.current = L.polyline(partnerTrailLatLngs, partnerOptions).addTo(map);
    }
  }
}

function updateSafeZones(layer, safeZones = []) {
  if (!layer) return;
  layer.clearLayers();

  safeZones.forEach((zone) => {
    const latLng = toLatLng(zone);
    if (!latLng) return;

    L.circle(latLng, {
      radius: zone.radiusMeters || 500,
      color: '#8b5cf6',
      weight: 2,
      opacity: 0.58,
      fillColor: '#c4b5fd',
      fillOpacity: 0.12,
      dashArray: '6, 8',
    }).addTo(layer);

    L.marker(latLng, {
      icon: L.divIcon({
        html: `<div class="safe-zone-label-inner">${escapeHtml(zone.emoji || '📍')} ${escapeHtml(zone.name || 'Safe zone')}</div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
        className: 'safe-zone-label',
      }),
      interactive: false,
    }).addTo(layer);
  });
}

function updateMemoryPins(layer, memoryPins = []) {
  if (!layer) return;
  layer.clearLayers();

  memoryPins.forEach((pin) => {
    const latLng = toLatLng(pin);
    if (!latLng) return;

    L.marker(latLng, {
      icon: L.divIcon({
        html: `
          <div class="memory-pin-marker"><span>♥</span></div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'memory-pin',
      }),
      zIndexOffset: 900,
    }).addTo(layer);
  });
}

function createAvatarIcon({ avatarUrl, label, borderColor, isLive, isDimmed, activity, ageSecs }) {
  const initial = label ? label.charAt(0).toUpperCase() : '?';
  
  // Recency styling
  let ringOpacity = 1;
  let avatarOpacity = 1;
  let hasPulse = false;
  
  if (ageSecs < 30) {
    hasPulse = true;
  } else if (ageSecs <= 300) {
    // Fade from 100% to 30% over the 30s to 300s window
    ringOpacity = 1 - ((ageSecs - 30) / 270) * 0.7;
  } else {
    // Stale
    ringOpacity = 0;
    avatarOpacity = 0.7;
  }
  
  const markerClass = [
    'avatar-marker-shell',
    isLive ? 'is-live' : '',
    isDimmed ? 'is-dimmed' : '',
    hasPulse ? 'has-pulse' : '',
    ageSecs > 300 ? 'is-stale' : '',
  ]
    .filter(Boolean)
    .join(' ');
    
  const photoHtml = avatarUrl
    ? `<img src="${escapeAttribute(avatarUrl)}" alt="" style="opacity: ${avatarOpacity}; transition: opacity 0.3s;" />`
    : `<span style="opacity: ${avatarOpacity}; transition: opacity 0.3s;">${escapeHtml(initial)}</span>`;

  const activityBadgeHtml = getActivityBadgeHtml(activity);

  return L.divIcon({
    html: `
      <div class="${markerClass}" style="--marker-color: ${borderColor};">
        <span class="avatar-marker-live-ring" style="opacity: ${ringOpacity}; transition: opacity 0.5s;"></span>
        <div class="avatar-marker-photo">
          ${photoHtml}
        </div>
        ${activityBadgeHtml}
      </div>
      <div class="avatar-marker-label">${escapeHtml(label || 'Partner')}</div>
    `,
    iconSize: [72, 80],
    iconAnchor: [36, 36],
    popupAnchor: [0, -34],
    className: 'avatar-marker',
  });
}

function getActivityBadgeHtml(activity) {
  if (!activity || activity === 'stationary') return '';
  
  let svg = '';
  if (activity === 'walking') {
    svg = `<svg viewBox="0 0 320 512" fill="currentColor" class="w-3 h-3"><path d="M208 96c26.5 0 48-21.5 48-48S234.5 0 208 0s-48 21.5-48 48 21.5 48 48 48zm94.5 149.1l-23.3-11.8c-9.7-4.9-21.2-1.9-27 7.1L225 281.1V184c0-22.1-17.9-40-40-40h-24c-22.1 0-40 17.9-40 40v263c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V328h16v160c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V365.8l47.5 46.1c9.2 8.9 23.9 9.3 33.6 1l18.5-15.8c9.9-8.4 10.5-23.5 1.4-32z"/></svg>`;
  } else if (activity === 'driving') {
    svg = `<svg viewBox="0 0 512 512" fill="currentColor" class="w-3 h-3"><path d="M499.99 176h-59.87l-16.64-41.6C406.38 91.63 365.57 64 319.5 64h-127c-46.06 0-86.88 27.63-103.98 70.4L71.87 176H12.01C4.2 176-1.53 183.34.37 190.91l6 24C7.7 220.25 12.5 224 18.01 224h20.07C24.65 235.73 16 252.78 16 272v48c0 16.12 6.16 30.67 16 41.93V416c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h256v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-54.07c9.84-11.25 16-25.8 16-41.93v-48c0-19.22-8.65-36.27-22.07-48H494c5.51 0 10.31-3.75 11.64-9.09l6-24c1.89-7.57-3.84-14.91-11.65-14.91zM128 352c-22.09 0-40-17.91-40-40s17.91-40 40-40 40 17.91 40 40-17.91 40-40 40zm256 0c-22.09 0-40-17.91-40-40s17.91-40 40-40 40 17.91 40 40-17.91 40-40 40zm12-176H116l19.2-48c9.57-23.92 32.26-40 57.8-40h126.1c25.4 0 48.06 16.03 57.65 39.81L396 176z"/></svg>`;
  } else if (activity === 'moving') { // generic bicycle
    svg = `<svg viewBox="0 0 640 512" fill="currentColor" class="w-3 h-3"><path d="M312 144c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48zM104 224c-57.4 0-104 46.6-104 104s46.6 104 104 104 104-46.6 104-104-46.6-104-104-104zm0 160c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56zm304-160c-57.4 0-104 46.6-104 104s46.6 104 104 104 104-46.6 104-104-46.6-104-104-104zm0 160c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56zM464.3 118.8L377.2 206h-59.4l41-41-43-43H140.4l-30.3-43h205.7l148.5 39.8z"/></svg>`;
  }

  return `
    <div class="avatar-activity-badge bg-white text-gray-700 shadow-sm border border-gray-100 rounded-full flex items-center justify-center absolute -bottom-1 -right-1 w-6 h-6 z-50">
      ${svg}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
