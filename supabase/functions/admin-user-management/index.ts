import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type AppRole = "superuser" | "owner_admin" | "limited_user" | "read_only";

type InvitePayload = {
  mode: "invite";
  email: string;
  fullName: string;
  preferredLanguage: "es" | "en";
  role: AppRole;
  boatIds: string[];
};

type ListUsersPayload = {
  mode: "list-users";
};

type ListBoatsPayload = {
  mode: "list-boats";
};

type AssignPayload = {
  mode: "assign";
  userId: string;
  role: AppRole;
  boatIds: string[];
};

type UpdatePayload = {
  mode: "update";
  userId: string;
  role?: AppRole;
  boatIds?: string[];
  password?: string;
  acceptInvite?: boolean;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  preferred_language: "es" | "en" | null;
  is_superuser: boolean | null;
  boat_memberships:
    | Array<{
        id: string;
        boat_id: string;
        role: AppRole;
        boats: Array<{
          id: string;
          name: string;
        }> | null;
      }>
    | null;
};

type AuthUser = {
  id: string;
  email?: string;
  invited_at?: string | null;
  confirmed_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
};

const allPermissions = [
  "view",
  "create",
  "edit",
  "delete",
  "close",
  "approve",
  "manage_users",
  "manage_attachments",
  "manage_shared_searches"
];

const rolePermissions: Record<AppRole, string[]> = {
  superuser: allPermissions,
  owner_admin: [
    "view",
    "create",
    "edit",
    "delete",
    "close",
    "approve",
    "manage_attachments",
    "manage_shared_searches"
  ],
  limited_user: ["view", "create", "edit", "manage_attachments"],
  read_only: ["view"]
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

async function requireSuperuser(
  serviceClient: ReturnType<typeof createClient>,
  authHeader: string | null
) {
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  );

  const {
    data: { user },
    error: authError
  } = await userClient.auth.getUser();

  if (authError || !user) {
    throw new Error("Invalid session");
  }

  const { data, error } = await serviceClient
    .from("user_profiles")
    .select("is_superuser")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.is_superuser) {
    const { data: legacyMembership, error: legacyMembershipError } = await serviceClient
      .from("boat_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "superuser")
      .limit(1)
      .maybeSingle();

    if (legacyMembershipError) {
      throw new Error(legacyMembershipError.message);
    }

    if (!legacyMembership) {
      throw new Error("Superuser role required");
    }
  }

  return user;
}

async function setUserSuperuserState(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  isSuperuser: boolean
) {
  const { error } = await serviceClient
    .from("user_profiles")
    .update({ is_superuser: isSuperuser })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function clearUserBoatMemberships(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
) {
  const { error } = await serviceClient
    .from("boat_memberships")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return [] as string[];
}

function requireBoatAssignmentsForScopedRole(role: AppRole, boatIds: string[]) {
  if (role !== "superuser" && !boatIds.length) {
    throw new Error("At least one boat is required for non-superuser roles");
  }
}

async function assignBoats(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  boatIds: string[],
  role: AppRole
) {
  const createdMembershipIds: string[] = [];

  for (const boatId of boatIds) {
    const { data: membership, error: membershipError } = await serviceClient
      .from("boat_memberships")
      .upsert(
        {
          boat_id: boatId,
          user_id: userId,
          role
        },
        {
          onConflict: "boat_id,user_id"
        }
      )
      .select("id")
      .single();

    if (membershipError || !membership) {
      throw new Error(membershipError?.message ?? "Unable to save membership");
    }

    createdMembershipIds.push(membership.id);

    const { error: deletePermissionsError } = await serviceClient
      .from("boat_membership_permissions")
      .delete()
      .eq("membership_id", membership.id);

    if (deletePermissionsError) {
      throw new Error(deletePermissionsError.message);
    }

    const permissions = rolePermissions[role].map((permission) => ({
      membership_id: membership.id,
      permission
    }));

    const { error: permissionError } = await serviceClient
      .from("boat_membership_permissions")
      .insert(permissions);

    if (permissionError) {
      throw new Error(permissionError.message);
    }
  }

  return createdMembershipIds;
}

async function updateUserRole(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  role: AppRole
) {
  const { data: memberships, error: membershipsError } = await serviceClient
    .from("boat_memberships")
    .select("id")
    .eq("user_id", userId);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const membershipIds = (memberships ?? []).map((membership: { id: string }) => membership.id);

  if (!membershipIds.length) {
    return membershipIds;
  }

  const { error: roleError } = await serviceClient
    .from("boat_memberships")
    .update({ role })
    .eq("user_id", userId);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const { error: deletePermissionsError } = await serviceClient
    .from("boat_membership_permissions")
    .delete()
    .in("membership_id", membershipIds);

  if (deletePermissionsError) {
    throw new Error(deletePermissionsError.message);
  }

  const permissions = membershipIds.flatMap((membershipId: string) =>
    rolePermissions[role].map((permission) => ({
      membership_id: membershipId,
      permission
    }))
  );

  const { error: permissionError } = await serviceClient
    .from("boat_membership_permissions")
    .insert(permissions);

  if (permissionError) {
    throw new Error(permissionError.message);
  }

  return membershipIds;
}

async function syncUserBoats(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  boatIds: string[],
  role: AppRole
) {
  if (!boatIds.length) {
    const { error: deleteAllMembershipsError } = await serviceClient
      .from("boat_memberships")
      .delete()
      .eq("user_id", userId);

    if (deleteAllMembershipsError) {
      throw new Error(deleteAllMembershipsError.message);
    }

    return [];
  }

  const { error: deleteMembershipsError } = await serviceClient
    .from("boat_memberships")
    .delete()
    .eq("user_id", userId)
    .not("boat_id", "in", `(${boatIds.join(",")})`);

  if (deleteMembershipsError) {
    throw new Error(deleteMembershipsError.message);
  }

  return assignBoats(serviceClient, userId, boatIds, role);
}

async function listAdminUsers(serviceClient: ReturnType<typeof createClient>) {
  const { data: profiles, error: profilesError } = await serviceClient
    .from("user_profiles")
    .select(
      `
        id,
        email,
        full_name,
        preferred_language,
        is_superuser,
        boat_memberships (
          id,
          boat_id,
          role,
          boats (
            id,
            name
          )
        )
      `
    )
    .order("created_at", { ascending: true });

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const {
    data: { users },
    error: usersError
  } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (usersError) {
    throw new Error(usersError.message);
  }

  const authUsersById = new Map((users as AuthUser[]).map((user) => [user.id, user]));

  return ((profiles ?? []) as ProfileRow[]).map((row) => {
    const authUser = authUsersById.get(row.id);
    const acceptedAt = authUser?.confirmed_at ?? authUser?.email_confirmed_at ?? null;
    const invitedAt = authUser?.invited_at ?? null;
    const inviteStatus = acceptedAt ? "accepted" : invitedAt ? "pending" : "not_invited";

    return {
      id: row.id,
      email: row.email ?? authUser?.email ?? "-",
      fullName: row.full_name ?? "Unnamed user",
      preferredLanguage: row.preferred_language ?? "es",
      isSuperuser: Boolean(row.is_superuser),
      inviteStatus,
      invitedAt,
      acceptedAt,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
      assignments:
        row.boat_memberships?.map((membership) => ({
          membershipId: membership.id,
          boatId: membership.boat_id,
          boatName: membership.boats?.[0]?.name ?? "Unknown boat",
          role: membership.role
        })) ?? []
    };
  });
}

async function listAdminBoats(serviceClient: ReturnType<typeof createClient>) {
  const { data, error } = await serviceClient
    .from("boats")
    .select("id, name, boat_type")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "Missing Supabase environment variables" });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    await requireSuperuser(serviceClient, request.headers.get("Authorization"));

    const payload = (await request.json()) as
      | ListUsersPayload
      | ListBoatsPayload
      | InvitePayload
      | AssignPayload
      | UpdatePayload;

    if (payload.mode === "list-users") {
      return jsonResponse(200, {
        users: await listAdminUsers(serviceClient)
      });
    }

    if (payload.mode === "list-boats") {
      return jsonResponse(200, {
        boats: await listAdminBoats(serviceClient)
      });
    }

    if (payload.mode === "invite") {
      requireBoatAssignmentsForScopedRole(payload.role, payload.boatIds);

      const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(payload.email, {
        data: {
          full_name: payload.fullName,
          preferred_language: payload.preferredLanguage
        }
      });

      let userId: string;

      if (error) {
        const isAlreadyRegistered =
          error.message?.toLowerCase().includes("already been registered") ||
          error.message?.toLowerCase().includes("already registered") ||
          error.message?.toLowerCase().includes("user already exists") ||
          error.status === 422;

        if (!isAlreadyRegistered) {
          throw new Error(error.message ?? "Unable to invite user");
        }

        const {
          data: { users: existingUsers },
          error: listError
        } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

        if (listError) {
          throw new Error(listError.message);
        }

        const existing = (existingUsers as AuthUser[]).find(
          (u) => u.email?.toLowerCase() === payload.email.toLowerCase()
        );

        if (!existing) {
          throw new Error("User already registered but could not be found");
        }

        userId = existing.id;
      } else {
        if (!data.user) {
          throw new Error("Unable to invite user");
        }
        userId = data.user.id;
      }

      const { error: profileError } = await serviceClient.from("user_profiles").upsert(
        {
          id: userId,
          email: payload.email,
          full_name: payload.fullName,
          preferred_language: payload.preferredLanguage,
          is_superuser: payload.role === "superuser"
        },
        {
          onConflict: "id"
        }
      );

      if (profileError) {
        throw new Error(profileError.message);
      }

      const membershipIds =
        payload.role === "superuser"
          ? []
          : await assignBoats(serviceClient, userId, payload.boatIds, payload.role);

      return jsonResponse(200, {
        userId,
        membershipIds
      });
    }

    if (payload.mode === "assign") {
      await setUserSuperuserState(serviceClient, payload.userId, payload.role === "superuser");
      requireBoatAssignmentsForScopedRole(payload.role, payload.boatIds);

      const membershipIds =
        payload.role === "superuser"
          ? await clearUserBoatMemberships(serviceClient, payload.userId)
          : await assignBoats(serviceClient, payload.userId, payload.boatIds, payload.role);

      return jsonResponse(200, {
        userId: payload.userId,
        membershipIds
      });
    }

    if (!payload.role && !payload.password?.trim() && !payload.boatIds && !payload.acceptInvite) {
      throw new Error("Nothing to update");
    }

    let membershipIds: string[] = [];

    if (payload.boatIds) {
      if (!payload.role) {
        throw new Error("Role is required when updating boat access");
      }

      await setUserSuperuserState(serviceClient, payload.userId, payload.role === "superuser");

      requireBoatAssignmentsForScopedRole(payload.role, payload.boatIds);

      membershipIds =
        payload.role === "superuser"
          ? await clearUserBoatMemberships(serviceClient, payload.userId)
          : await syncUserBoats(serviceClient, payload.userId, payload.boatIds, payload.role);
    } else if (payload.role) {
      await setUserSuperuserState(serviceClient, payload.userId, payload.role === "superuser");
      membershipIds =
        payload.role === "superuser"
          ? await clearUserBoatMemberships(serviceClient, payload.userId)
          : await updateUserRole(serviceClient, payload.userId, payload.role);
    }

    if (payload.password?.trim() || payload.acceptInvite) {
      const authAttributes: {
        password?: string;
        email_confirm?: boolean;
      } = {};

      if (payload.password?.trim()) {
        authAttributes.password = payload.password;
        authAttributes.email_confirm = true;
      }

      if (payload.acceptInvite) {
        authAttributes.email_confirm = true;
      }

      const { error: passwordError } = await serviceClient.auth.admin.updateUserById(
        payload.userId,
        authAttributes
      );

      if (passwordError) {
        throw new Error(passwordError.message);
      }
    }

    return jsonResponse(200, {
      userId: payload.userId,
      membershipIds,
      passwordUpdated: Boolean(payload.password?.trim())
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : "Unknown admin error"
    });
  }
});
