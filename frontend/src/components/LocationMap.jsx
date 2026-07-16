import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '../utils/locationUtils';

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
  onMapReady,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const myMarkerRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const circlesRef = useRef({});

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map centered on my location or default
      const center = myLocation
        ? [myLocation.latitude, myLocation.longitude]
        : [28.7041, 77.1025]; // Delhi default

      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      // Use OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      onMapReady?.(mapInstanceRef.current);
    }

    // Update my location marker
    if (myLocation && mapInstanceRef.current) {
      if (myMarkerRef.current) {
        myMarkerRef.current.setLatLng([
          myLocation.latitude,
          myLocation.longitude,
        ]);
      } else {
        const myMarker = createAvatarMarker(
          [myLocation.latitude, myLocation.longitude],
          user?.avatarUrl,
          'You',
          '#3b82f6'
        );
        myMarker.addTo(mapInstanceRef.current);
        myMarkerRef.current = myMarker;
      }

      // Add pulsing circle around my location
      if (circlesRef.current.myCircle) {
        circlesRef.current.myCircle.setLatLng([
          myLocation.latitude,
          myLocation.longitude,
        ]);
      } else {
        circlesRef.current.myCircle = L.circleMarker(
          [myLocation.latitude, myLocation.longitude],
          {
            radius: 12,
            fillColor: '#ec4899',
            color: '#ec4899',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
          }
        ).addTo(mapInstanceRef.current);
      }
    }

    // Update partner location marker
    if (partnerLocation && mapInstanceRef.current) {
      if (partnerMarkerRef.current) {
        partnerMarkerRef.current.setLatLng([
          partnerLocation.latitude,
          partnerLocation.longitude,
        ]);
      } else {
        const partnerMarker = createAvatarMarker(
          [partnerLocation.latitude, partnerLocation.longitude],
          partner?.avatarUrl,
          partner?.name || 'Partner',
          '#ee2a7b'
        );
        partnerMarker.addTo(mapInstanceRef.current);
        partnerMarkerRef.current = partnerMarker;
      }

      // Draw partner's movement trail if we have history
      if (partnerTrail && partnerTrail.length > 1) {
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(partnerTrail);
        } else {
          polylineRef.current = L.polyline(partnerTrail, {
            color: '#ee2a7b',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 8',
            lineJoin: 'round',
          }).addTo(mapInstanceRef.current);
        }
      }

      // Fit bounds to show both markers if we have my location
      if (myLocation && myMarkerRef.current) {
        const group = L.featureGroup([myMarkerRef.current, partnerMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15), {
          maxZoom: 15,
          animate: true,
          duration: 1
        });
      }
    }

    // Add safe zones
    if (safeZones && safeZones.length > 0) {
      safeZones.forEach((zone) => {
        const zoneKey = zone._id || zone.id;

        if (!circlesRef.current[zoneKey]) {
          L.circle(
            [zone.latitude, zone.longitude],
            {
              radius: zone.radiusMeters,
              color: '#a78bfa',
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.1,
              dashArray: '5, 5',
            }
          ).addTo(mapInstanceRef.current);

          // Add label
          L.marker([zone.latitude, zone.longitude], {
            icon: L.divIcon({
              html: `<div style="
                font-size: 12px;
                font-weight: 600;
                color: #7c3aed;
                background: rgba(167, 139, 250, 0.2);
                padding: 2px 6px;
                border-radius: 3px;
                white-space: nowrap;
              ">${zone.emoji || '📍'} ${zone.name}</div>`,
              iconSize: [100, 20],
              className: 'safe-zone-label',
            }),
          }).addTo(mapInstanceRef.current);

          circlesRef.current[zoneKey] = true;
        }
      });
    }
  }, [myLocation, partnerLocation, safeZones, onMapReady]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

function createAvatarMarker(latLng, avatarUrl, label, borderColor) {
  const initial = label ? label.charAt(0).toUpperCase() : '?';
  const imgHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${borderColor}; color: white; font-weight: bold; font-size: 18px; border-radius: 50%;">${initial}</div>`;

  const icon = L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        background: white;
        overflow: hidden;
      ">
        ${imgHtml}
      </div>
      <div style="
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        color: #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        white-space: nowrap;
        z-index: 10;
      ">${label}</div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    className: 'avatar-marker',
  });

  return L.marker(latLng, { icon, zIndexOffset: 1000 });
}
