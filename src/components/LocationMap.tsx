import { useEffect, useRef } from "react";
import type * as L from "leaflet";

interface Props {
  lat: number;
  lon: number;
  onMove: (lat: number, lon: number) => void;
}

export function LocationMap({ lat, lon, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const markerRef   = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Lazy-load leaflet so it doesn't pollute SSR / tests
    import("leaflet").then((L) => {
      // Fix default icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) {
        mapRef.current.setView([lat, lon], mapRef.current.getZoom());
        markerRef.current?.setLatLng([lat, lon]);
        return;
      }

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([lat, lon], 14);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const { lat: newLat, lng: newLon } = marker.getLatLng();
        onMove(newLat, newLon);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onMove(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current  = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move marker/view when lat/lon prop changes from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lon]);
    mapRef.current.setView([lat, lon], 14, { animate: true });
  }, [lat, lon]);

  return (
    <div
      ref={containerRef}
      className="location-map"
      style={{ height: 240, borderRadius: "0.6rem", overflow: "hidden", marginTop: "0.5rem" }}
    />
  );
}
