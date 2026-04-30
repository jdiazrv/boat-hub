import { useEffect, useRef, useState } from "react";
import { LocationMap } from "./LocationMap";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  type: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    marina?: string;
    harbour?: string;
    fuel?: string;
  };
}

export interface GeoPlace {
  name: string;
  country: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

function toGeoPlace(r: NominatimResult): GeoPlace {
  const a = r.address;
  const placeName = a.marina ?? a.harbour ?? a.fuel ?? r.name;
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
  const road = [a.road, a.house_number].filter(Boolean).join(" ") || null;
  const addressParts = [road, a.postcode, city].filter(Boolean);
  return {
    name: placeName,
    country: a.country ?? null,
    region: a.state ?? city,
    address: addressParts.join(", ") || null,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
  };
}

function formatResult(r: NominatimResult): string {
  const p = toGeoPlace(r);
  return [p.name, p.region, p.country].filter(Boolean).join(", ");
}

// ── Simple text search — used in fuel / maintenance (no map) ────────────────
export function LocationSearch({
  value, onChange, onPick, label, placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  onPick?: (place: GeoPlace) => void;
  label: string;
  placeholder?: string;
}) {
  const [query, setQuery]     = useState(value ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value ?? ""); }, [value]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "es,en" } },
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 500);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(r: NominatimResult) {
    const place   = toGeoPlace(r);
    const display = formatResult(r);
    setQuery(display);
    onChange(display);
    onPick?.(place);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapRef} className="location-search">
      <label className="field-label">{label}</label>
      <div className="location-search-input-wrap">
        <input className="form-input" type="text" value={query}
          placeholder={placeholder ?? "Buscar puerto, marina…"}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value || null); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="location-search-spinner">⟳</span>}
      </div>
      {open && results.length > 0 && (
        <ul className="location-search-dropdown">
          {results.map((r) => (
            <li key={r.place_id} onMouseDown={() => pick(r)}>{formatResult(r)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Geo search + draggable map — used in marinas / shipyards ────────────────
export function LocationSearchWithMap({
  latitude, longitude, onPick, label,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (place: Partial<GeoPlace>) => void;
  label: string;
}) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords]   = useState<{ lat: number; lon: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lon: longitude } : null,
  );
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep map in sync when parent resets form
  useEffect(() => {
    if (latitude != null && longitude != null) setCoords({ lat: latitude, lon: longitude });
    else setCoords(null);
  }, [latitude, longitude]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "es,en" } },
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 500);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(r: NominatimResult) {
    const place = toGeoPlace(r);
    setQuery(formatResult(r));
    setCoords({ lat: place.latitude!, lon: place.longitude! });
    // Don't touch name — only fill geo fields
    onPick({
      country:   place.country,
      region:    place.region,
      address:   place.address,
      latitude:  place.latitude,
      longitude: place.longitude,
    });
    setOpen(false);
    setResults([]);
  }

  function handleMapMove(lat: number, lon: number) {
    setCoords({ lat, lon });
    onPick({ latitude: lat, longitude: lon });
  }

  return (
    <div ref={wrapRef} className="location-search">
      <label className="field-label">{label}</label>
      <div className="location-search-input-wrap">
        <input className="form-input" type="text" value={query}
          placeholder="Buscar en el mapa…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="location-search-spinner">⟳</span>}
      </div>
      {open && results.length > 0 && (
        <ul className="location-search-dropdown">
          {results.map((r) => (
            <li key={r.place_id} onMouseDown={() => pick(r)}>{formatResult(r)}</li>
          ))}
        </ul>
      )}
      {coords && (
        <LocationMap lat={coords.lat} lon={coords.lon} onMove={handleMapMove} />
      )}
    </div>
  );
}
