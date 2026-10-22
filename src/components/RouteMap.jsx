import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function RouteMap({ origin, destination, route, userLocation }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined;

    const map = L.map(mapElementRef.current, { zoomControl: true })
      .setView([3.4516, -76.532], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
      if (markersRef.current) map.removeLayer(markersRef.current);
      routeLayerRef.current = null;
      markersRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    routeLayerRef.current = null;
    if (markersRef.current) map.removeLayer(markersRef.current);
    markersRef.current = null;

    const markers = L.layerGroup().addTo(map);
    markersRef.current = markers;
    const bounds = [];

    if (origin) {
      L.circleMarker(origin, { radius: 8, color: '#fff', weight: 2, fillColor: '#059669', fillOpacity: 1 })
        .bindPopup('Origen')
        .addTo(markers);
      bounds.push(origin);
    }
    if (destination) {
      L.circleMarker(destination, { radius: 8, color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 })
        .bindPopup('Destino')
        .addTo(markers);
      bounds.push(destination);
    }
    if (userLocation) {
      L.circleMarker(userLocation, {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).bindPopup('Tu ubicación actual').addTo(markers);
      bounds.push(userLocation);
    }
    route?.stopDetails?.forEach((stop) => {
      L.circleMarker(stop.coords, {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: '#7c3aed',
        fillOpacity: 1,
      }).bindPopup(`Parada MIO · ${stop.role}: ${stop.code}`).addTo(markers);
      bounds.push(stop.coords);
    });
    if (route?.polyline?.length) {
      const line = L.polyline(route.polyline, {
        color: '#059669',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      routeLayerRef.current = line;
      bounds.push(...route.polyline);
    }

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [24, 24] });
    else if (bounds.length === 1) map.setView(bounds[0], 15);
    else map.setView([3.4516, -76.532], 12);

    return () => {
      if (map.hasLayer(markers)) map.removeLayer(markers);
      if (markersRef.current === markers) markersRef.current = null;
    };
  }, [origin, destination, route, userLocation]);

  return <div ref={mapElementRef} aria-label="Mapa de origen, destino y ruta" style={{ height: 340, width: '100%', borderRadius: 14, overflow: 'hidden' }} />;
}
