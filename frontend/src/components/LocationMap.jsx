import React, { useEffect, useRef } from 'react';
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
  const partnerTrailRef = useRef(null);
  const connectionLineRef = useRef(null);
  const safeZonesLayerRef = useRef(null);
  const memoryPinsLayerRef = useRef(null);

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

    if (myLatLng) {
      const myIcon = createAvatarIcon({
        avatarUrl: user?.avatarUrl,
        label: 'You',
        borderColor: '#0ea5e9',
        isLive: sharingActive,
        isDimmed: !sharingActive,
      });

      if (myMarkerRef.current) {
        myMarkerRef.current.setLatLng(myLatLng);
        myMarkerRef.current.setIcon(myIcon);
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
      });

      if (partnerMarkerRef.current) {
        partnerMarkerRef.current.setLatLng(partnerLatLng);
        partnerMarkerRef.current.setIcon(partnerIcon);
      } else {
        partnerMarkerRef.current = L.marker(partnerLatLng, {
          icon: partnerIcon,
          zIndexOffset: 1200,
        }).addTo(map);
      }

      visibleMarkers.push(partnerMarkerRef.current);
    }

    updateConnectionLine(map, connectionLineRef, myLatLng, partnerLatLng, sharingActive && partnerSharingActive);
    updatePartnerTrail(map, partnerTrailRef, partnerTrail, partnerSharingActive);
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
    partnerTrail,
    safeZones,
    sharingActive,
    user,
  ]);

  return <div ref={mapRef} className="location-map" />;
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

function updatePartnerTrail(map, trailRef, partnerTrail, isActive) {
  const trailLatLngs = normalizeTrail(partnerTrail);

  if (trailLatLngs.length < 2) {
    if (trailRef.current) {
      map.removeLayer(trailRef.current);
      trailRef.current = null;
    }
    return;
  }

  const options = {
    color: isActive ? '#ee2a7b' : '#94a3b8',
    weight: 3,
    opacity: isActive ? 0.5 : 0.28,
    dashArray: '4, 8',
    lineJoin: 'round',
  };

  if (trailRef.current) {
    trailRef.current.setLatLngs(trailLatLngs);
    trailRef.current.setStyle(options);
  } else {
    trailRef.current = L.polyline(trailLatLngs, options).addTo(map);
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

function createAvatarIcon({ avatarUrl, label, borderColor, isLive, isDimmed }) {
  const initial = label ? label.charAt(0).toUpperCase() : '?';
  const markerClass = [
    'avatar-marker-shell',
    isLive ? 'is-live' : '',
    isDimmed ? 'is-dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const photoHtml = avatarUrl
    ? `<img src="${escapeAttribute(avatarUrl)}" alt="" />`
    : `<span>${escapeHtml(initial)}</span>`;

  return L.divIcon({
    html: `
      <div class="${markerClass}" style="--marker-color: ${borderColor}">
        <span class="avatar-marker-live-ring"></span>
        <div class="avatar-marker-photo">
          ${photoHtml}
        </div>
      </div>
      <div class="avatar-marker-label">${escapeHtml(label || 'Partner')}</div>
    `,
    iconSize: [72, 80],
    iconAnchor: [36, 36],
    popupAnchor: [0, -34],
    className: 'avatar-marker',
  });
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
