import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AppRole } from "../lib/types";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  isSuperuser: boolean;
  permissionLevel: string | null;
  /** boatId → role for boats this user belongs to */
  boatRoles: Record<string, AppRole>;
  canEditBoat: (boatId: string) => boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type MembershipRow = {
  role: AppRole;
  boat_id: string;
  boats: { name: string | null } | { name: string | null }[] | null;
};

function getBoatName(boats: MembershipRow["boats"]) {
  if (Array.isArray(boats)) {
    return boats[0]?.name ?? "Boat";
  }

  return boats?.name ?? "Boat";
}

function formatPermissionLevel(memberships: MembershipRow[]) {
  const grouped = memberships.reduce<Record<string, string[]>>((acc, membership) => {
    acc[membership.role] = acc[membership.role] ?? [];
    acc[membership.role].push(getBoatName(membership.boats));
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([role, boats]) => `${role}: ${boats.join(", ")}`)
    .join(" / ");
}

async function loadAccess(userId: string): Promise<{
  isSuperuser: boolean;
  permissionLevel: string | null;
  boatRoles: Record<string, AppRole>;
}> {
  if (!supabase) return { isSuperuser: false, permissionLevel: null, boatRoles: {} };

  const { data } = await supabase
    .from("user_profiles")
    .select("is_superuser")
    .eq("id", userId)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("boat_memberships")
    .select("role, boat_id, boats(name)")
    .eq("user_id", userId)
    .order("role");

  const membershipRows = ((memberships ?? []) as MembershipRow[]);
  const isSuperuser = Boolean(data?.is_superuser) || membershipRows.some((row) => row.role === "superuser");

  const boatRoles = membershipRows.reduce<Record<string, AppRole>>((acc, row) => {
    acc[row.boat_id] = row.role;
    return acc;
  }, {});

  return {
    isSuperuser,
    permissionLevel: isSuperuser ? "superuser" : formatPermissionLevel(membershipRows),
    boatRoles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [permissionLevel, setPermissionLevel] = useState<string | null>(null);
  const [boatRoles, setBoatRoles] = useState<Record<string, AppRole>>({});

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      void loadAccess(session.user.id).then((access) => {
        setIsSuperuser(access.isSuperuser);
        setPermissionLevel(access.permissionLevel);
        setBoatRoles(access.boatRoles);
      });
    } else {
      setIsSuperuser(false);
      setPermissionLevel(null);
      setBoatRoles({});
    }
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      isSuperuser,
      permissionLevel,
      boatRoles,
      canEditBoat(boatId: string) {
        if (isSuperuser) return true;
        const role = boatRoles[boatId];
        return role === "owner_admin";
      },
      async signIn(email, password) {
        if (!supabase) {
          return null;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        return error?.message ?? null;
      },
      async signOut() {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
      }
    }),
    [loading, session, isSuperuser, permissionLevel, boatRoles]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
