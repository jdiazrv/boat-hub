import { supabase } from "./supabase";
import type { AdminBoatOption, AdminUser, AppRole } from "./types";

type BoatRow = {
  id: string;
  name: string;
  boat_type: string | null;
};

async function getFunctionErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const body = (await error.context.clone().json()) as { error?: unknown; message?: unknown };
      const message = body.error ?? body.message;

      if (typeof message === "string" && message.trim()) {
        return message;
      }
    } catch {
      try {
        const message = await error.context.clone().text();

        if (message.trim()) {
          return message;
        }
      } catch {
        // Fall through to the generic error message.
      }
    }
  }

  return error instanceof Error ? error.message : "Admin function failed";
}

async function invokeAdminFunction(body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await supabase.functions.invoke("admin-user-management", { body });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  return data;
}

export async function isCurrentUserSuperuser(userId: string) {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("is_superuser")
    .eq("id", userId)
    .maybeSingle();

  if (!error && data?.is_superuser) {
    return true;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("boat_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "superuser")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  return Boolean(membership?.id);
}

export async function loadAdminUsers() {
  const data = (await invokeAdminFunction({ mode: "list-users" })) as {
    users?: unknown;
  };

  return (Array.isArray(data.users) ? data.users : []) as AdminUser[];
}

export async function loadAdminBoats() {
  const data = (await invokeAdminFunction({ mode: "list-boats" })) as {
    boats?: unknown;
  };

  return ((Array.isArray(data.boats) ? data.boats : []) as BoatRow[]).map(
    (row): AdminBoatOption => ({
      id: row.id,
      name: row.name,
      type: row.boat_type ?? "Boat"
    })
  );
}

export async function inviteUserAndAssignBoats(payload: {
  email: string;
  fullName: string;
  preferredLanguage: "es" | "en";
  role: "superuser" | "owner_admin" | "limited_user" | "read_only";
  boatIds: string[];
}) {
  return invokeAdminFunction({
    mode: "invite",
    ...payload
  });
}

export async function assignExistingUserToBoats(payload: {
  userId: string;
  role: AppRole;
  boatIds: string[];
}) {
  return invokeAdminFunction({
    mode: "assign",
    ...payload
  });
}

export async function updateExistingUser(payload: {
  userId: string;
  role?: AppRole;
  boatIds?: string[];
  password?: string;
  acceptInvite?: boolean;
}) {
  return invokeAdminFunction({
    mode: "update",
    ...payload
  });
}

export async function deleteUser(userId: string) {
  return invokeAdminFunction({ mode: "delete", userId });
}
