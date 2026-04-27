import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Boat, BoatSummary } from "../lib/types";

type ActiveBoatContextValue = {
  activeBoatId: string | null;
  setActiveBoatId: (id: string | null) => void;
  activeBoat: Boat | BoatSummary | null;
};

const STORAGE_KEY = "boat_hub_active_boat";

const ActiveBoatContext = createContext<ActiveBoatContextValue | null>(null);

export function ActiveBoatProvider({
  children,
  boats,
}: {
  children: ReactNode;
  boats: (Boat | BoatSummary)[];
}) {
  const [activeBoatId, setActiveBoatIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  });

  // Auto-select first boat if none selected and boats are available
  useEffect(() => {
    if (!activeBoatId && boats.length > 0) {
      const firstId = boats[0].id;
      setActiveBoatIdState(firstId);
      try { localStorage.setItem(STORAGE_KEY, firstId); } catch { /* ignore */ }
    }
  }, [boats, activeBoatId]);

  // Clear selection if selected boat no longer exists
  useEffect(() => {
    if (activeBoatId && boats.length > 0 && !boats.find((b) => b.id === activeBoatId)) {
      const nextId = boats[0]?.id ?? null;
      setActiveBoatIdState(nextId);
      try {
        if (nextId) localStorage.setItem(STORAGE_KEY, nextId);
        else localStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
    }
  }, [boats, activeBoatId]);

  function setActiveBoatId(id: string | null) {
    setActiveBoatIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }

  const activeBoat = useMemo(
    () => (activeBoatId ? (boats.find((b) => b.id === activeBoatId) ?? null) : null),
    [activeBoatId, boats]
  );

  const value = useMemo<ActiveBoatContextValue>(
    () => ({ activeBoatId, setActiveBoatId, activeBoat }),
    [activeBoatId, activeBoat]
  );

  return (
    <ActiveBoatContext.Provider value={value}>{children}</ActiveBoatContext.Provider>
  );
}

export function useActiveBoat() {
  const ctx = useContext(ActiveBoatContext);
  if (!ctx) throw new Error("useActiveBoat must be used inside ActiveBoatProvider");
  return ctx;
}
