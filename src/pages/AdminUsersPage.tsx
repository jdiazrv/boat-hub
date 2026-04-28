import { useEffect, useMemo, useState } from "react";
import {
  inviteUserAndAssignBoats,
  isCurrentUserSuperuser,
  loadAdminBoats,
  loadAdminUsers,
  updateExistingUser
} from "../lib/admin";
import { isSupabaseConfigured } from "../lib/supabase";
import type { AdminBoatOption, AdminUser, AppRole } from "../lib/types";
import { useAuth } from "../providers/AuthProvider";

const roleOptions = [
  { value: "superuser", label: "Administrador total" },
  { value: "owner_admin", label: "Gestor" },
  { value: "limited_user", label: "Usuario operativo" },
  { value: "read_only", label: "Solo lectura" }
] as const;

const defaultRole: AppRole = "owner_admin";

const boatSearchLimit = 12;
const userSearchLimit = 12;

function BoatAccessPicker({
  boats,
  selectedBoatIds,
  onToggle
}: {
  boats: AdminBoatOption[];
  selectedBoatIds: string[];
  onToggle: (boatId: string) => void;
}) {
  const [boatSearch, setBoatSearch] = useState("");
  const selectedBoats = boats.filter((boat) => selectedBoatIds.includes(boat.id));
  const normalizedSearch = boatSearch.trim().toLowerCase();
  const matchingBoats = boats
    .filter((boat) => {
      if (!normalizedSearch) {
        return !selectedBoatIds.includes(boat.id);
      }

      return `${boat.name} ${boat.type}`.toLowerCase().includes(normalizedSearch);
    })
    .slice(0, boatSearchLimit);
  const hiddenMatchCount = Math.max(
    0,
    boats.filter((boat) => {
      if (!normalizedSearch) {
        return !selectedBoatIds.includes(boat.id);
      }

      return `${boat.name} ${boat.type}`.toLowerCase().includes(normalizedSearch);
    }).length - matchingBoats.length
  );

  return (
    <div className="boat-access-picker">
      <div className="selected-boats">
        {selectedBoats.length ? (
          selectedBoats.map((boat) => (
            <button
              className="selected-boat-chip"
              key={boat.id}
              onClick={() => onToggle(boat.id)}
              type="button"
            >
              <span>{boat.name}</span>
              <small>Quitar</small>
            </button>
          ))
        ) : (
          <span className="assignment-pill muted">Sin barcos seleccionados</span>
        )}
      </div>

      <label className="admin-search compact">
        <span>Buscar barcos</span>
        <input
          onChange={(event) => setBoatSearch(event.target.value)}
          placeholder="Nombre o tipo de barco"
          type="search"
          value={boatSearch}
        />
      </label>

      <div className="boat-result-list">
        {matchingBoats.map((boat) => {
          const selected = selectedBoatIds.includes(boat.id);

          return (
            <button
              className={selected ? "boat-result selected" : "boat-result"}
              key={boat.id}
              onClick={() => onToggle(boat.id)}
              type="button"
            >
              <span>{boat.name}</span>
              <small>{boat.type}</small>
            </button>
          );
        })}

        {!matchingBoats.length && (
          <span className="field-hint">
            {normalizedSearch ? "No hay barcos con esa busqueda." : "Todos los barcos ya estan seleccionados."}
          </span>
        )}

        {hiddenMatchCount > 0 && (
          <span className="field-hint">
            {hiddenMatchCount} resultados mas. Sigue escribiendo para acotar.
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [boats, setBoats] = useState<AdminBoatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLanguage, setInviteLanguage] = useState<"es" | "en">("es");
  const [inviteRole, setInviteRole] = useState<(typeof roleOptions)[number]["value"]>("owner_admin");
  const [inviteBoatIds, setInviteBoatIds] = useState<string[]>([]);

  const [managedUserId, setManagedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editRole, setEditRole] = useState<AppRole>(defaultRole);
  const [editBoatIds, setEditBoatIds] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState("");
  const [editAcceptInvite, setEditAcceptInvite] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const managedUser = users.find((user) => user.id === managedUserId) ?? null;
  const matchingUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = [
        user.fullName,
        user.email,
        user.preferredLanguage,
        user.inviteStatus,
        ...user.assignments.flatMap((assignment) => [assignment.boatName, assignment.role])
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [userSearch, users]);
  const visibleUsers = matchingUsers.slice(0, userSearchLimit);
  const hiddenUserCount = Math.max(0, matchingUsers.length - visibleUsers.length);

  async function refresh() {
    if (!session) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const superuser = await isCurrentUserSuperuser(session.user.id);
      setAllowed(superuser);

      if (!superuser) {
        setUsers([]);
        setBoats([]);
        setLoading(false);
        return;
      }

      const [nextUsers, nextBoats] = await Promise.all([loadAdminUsers(), loadAdminBoats()]);
      setUsers(nextUsers);
      setBoats(nextBoats);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [session?.user.id]);

  useEffect(() => {
    if (!managedUser) {
      setEditRole(defaultRole);
      setEditBoatIds([]);
      setEditPassword("");
      setEditAcceptInvite(false);
      return;
    }

    setEditRole(getUserRole(managedUser));
    setEditBoatIds(
      managedUser.isSuperuser ? [] : managedUser.assignments.map((assignment) => assignment.boatId)
    );
    setEditPassword("");
    setEditAcceptInvite(false);
  }, [managedUser?.id]);

  function toggleBoat(list: string[], boatId: string) {
    return list.includes(boatId) ? list.filter((id) => id !== boatId) : [...list, boatId];
  }

  function getUserRole(user: AdminUser): AppRole {
    return user.isSuperuser ? "superuser" : user.assignments[0]?.role ?? defaultRole;
  }

  function getRoleLabel(role: AppRole) {
    return roleOptions.find((option) => option.value === role)?.label ?? role;
  }

  function hasMixedRoles(user: AdminUser) {
    if (user.isSuperuser) {
      return false;
    }

    return new Set(user.assignments.map((assignment) => assignment.role)).size > 1;
  }

  function haveSameBoatIds(user: AdminUser, nextBoatIds: string[]) {
    const currentIds = user.assignments.map((assignment) => assignment.boatId).sort();
    const nextIds = [...nextBoatIds].sort();

    return currentIds.length === nextIds.length && currentIds.every((id, index) => id === nextIds[index]);
  }

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    try {
      await inviteUserAndAssignBoats({
        email: inviteEmail,
        fullName: inviteName,
        preferredLanguage: inviteLanguage,
        role: inviteRole,
        boatIds: inviteRole === "superuser" ? [] : inviteBoatIds
      });

      setInviteEmail("");
      setInviteName("");
      setInviteLanguage("es");
      setInviteRole("owner_admin");
      setInviteBoatIds([]);
      setNotice("Usuario creado y accesos guardados.");
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo crear el usuario");
    }
  }

  async function handleExistingUserUpdate(event: React.FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const nextPassword = editPassword.trim();
    const nextRole = editRole;
    const nextBoatIds = nextRole === "superuser" ? [] : editBoatIds;
    const shouldAcceptInvite = editAcceptInvite || (user.inviteStatus === "pending" && Boolean(nextPassword));

    if (
      !nextPassword &&
      !shouldAcceptInvite &&
      nextRole === getUserRole(user) &&
      !hasMixedRoles(user) &&
      haveSameBoatIds(user, nextBoatIds)
    ) {
      setNotice("No hay cambios que guardar para este usuario.");
      return;
    }

    setUpdatingUserId(user.id);

    try {
      await updateExistingUser({
        userId: user.id,
        role: nextRole,
        boatIds: nextBoatIds,
        password: nextPassword || undefined,
        acceptInvite: shouldAcceptInvite || undefined
      });

      setEditPassword("");
      setEditAcceptInvite(false);
      setNotice("Usuario actualizado.");
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No se pudo actualizar el usuario");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">Admin</span>
          <h2>Gestion de usuarios</h2>
        </div>
        <article className="panel-card">
          <p>Configura Supabase primero. Esta seccion depende de Auth, RLS y la Edge Function de usuarios.</p>
        </article>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">Admin</span>
          <h2>Gestion de usuarios</h2>
        </div>
        <article className="panel-card">
          <p>Cargando usuarios...</p>
        </article>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="page">
        <div className="section-title">
          <span className="eyebrow">Admin</span>
          <h2>Gestion de usuarios</h2>
        </div>
        <article className="panel-card">
          <p>
            Esta seccion solo esta disponible para administradores.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="section-title">
        <span className="eyebrow">Admin</span>
        <h2>Usuarios</h2>
      </div>

      {error && (
        <div className="banner warning-banner">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="banner success-banner">
          <strong>Listo</strong>
          <span>{notice}</span>
        </div>
      )}

      <div className="grid-two admin-top-grid">
        <article className="panel-card">
          <div className="panel-head">
            <h3>Crear usuario</h3>
            <span className="pill">Solo administradores</span>
          </div>
          <form className="admin-form" onSubmit={handleInviteSubmit}>
            <label>
              <span>Email</span>
              <input
                onChange={(event) => setInviteEmail(event.target.value)}
                required
                type="email"
                value={inviteEmail}
              />
            </label>
            <label>
              <span>Nombre visible</span>
              <input
                onChange={(event) => setInviteName(event.target.value)}
                required
                type="text"
                value={inviteName}
              />
            </label>
            <div className="split-fields">
              <label>
                <span>Idioma</span>
                <select
                  onChange={(event) => setInviteLanguage(event.target.value as "es" | "en")}
                  value={inviteLanguage}
                >
                  <option value="es">Espanol</option>
                  <option value="en">Ingles</option>
                </select>
              </label>
              <label>
                <span>Perfil</span>
                <select
                  onChange={(event) =>
                    setInviteRole(event.target.value as (typeof roleOptions)[number]["value"])
                  }
                  value={inviteRole}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <span className="field-label">Barcos asignados</span>
              <BoatAccessPicker
                boats={boats}
                onToggle={(boatId) => setInviteBoatIds((current) => toggleBoat(current, boatId))}
                selectedBoatIds={inviteBoatIds}
              />
            </div>
            <button type="submit">Crear usuario</button>
          </form>
        </article>
      </div>

      <article className="panel-card">
        <div className="panel-head">
          <h3>Usuarios actuales</h3>
          <span className="pill">
            {matchingUsers.length} / {users.length} usuarios
          </span>
        </div>

        <div className="admin-users-workspace">
          <div className="admin-users-list">
            <label className="admin-search">
              <span>Buscar usuarios</span>
              <input
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Nombre, email, barco o perfil"
                type="search"
                value={userSearch}
              />
            </label>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Invitacion</th>
                    <th>Barcos</th>
                    <th>Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr
                      className={user.id === managedUserId ? "selected" : undefined}
                      key={user.id}
                      onClick={() => setManagedUserId(user.id)}
                    >
                      <td>
                        <strong>{user.fullName}</strong>
                        <span>{user.email}</span>
                      </td>
                      <td>
                        <span className={`status-chip ${user.inviteStatus}`}>
                          {user.inviteStatus === "accepted"
                            ? "Aceptada"
                            : user.inviteStatus === "pending"
                              ? "Pendiente"
                              : "Sin invitacion"}
                        </span>
                      </td>
                      <td>{user.isSuperuser ? "Todos" : user.assignments.length}</td>
                      <td>{hasMixedRoles(user) ? "Varios" : getRoleLabel(getUserRole(user))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!matchingUsers.length && (
                <div className="empty-state">
                  <p>No hay usuarios con esa busqueda.</p>
                </div>
              )}
            </div>

            {hiddenUserCount > 0 && (
              <p className="inline-note">
                {hiddenUserCount} usuarios mas. Sigue escribiendo para acotar.
              </p>
            )}

            {matchingUsers.length > 0 && !managedUser && (
              <p className="inline-note">
                Selecciona un usuario para cambiar su perfil, barcos o contrasena.
              </p>
            )}
          </div>

          <aside className="user-edit-panel">
            {managedUser ? (
              <>
                <div className="panel-head">
                  <div>
                    <h3>{managedUser.fullName}</h3>
                    <p>
                      {managedUser.email} ·{" "}
                      {managedUser.inviteStatus === "accepted"
                        ? "Invitacion aceptada"
                        : managedUser.inviteStatus === "pending"
                          ? "Invitacion pendiente"
                          : "Sin invitacion enviada"}
                    </p>
                  </div>
                  <span className="pill">
                    {managedUser.isSuperuser ? "Todos los barcos" : `${managedUser.assignments.length} barcos`}
                  </span>
                </div>

                <div className="assignment-list">
                  {managedUser.isSuperuser ? (
                    <span className="assignment-pill">Acceso global · administrador total</span>
                  ) : managedUser.assignments.length ? (
                    managedUser.assignments.map((assignment) => (
                      <span className="assignment-pill" key={assignment.membershipId}>
                        {assignment.boatName} · {getRoleLabel(assignment.role)}
                      </span>
                    ))
                  ) : (
                    <span className="assignment-pill muted">Sin barcos asignados</span>
                  )}
                </div>

                <form
                  className="admin-form user-management-form"
                  onSubmit={(event) => handleExistingUserUpdate(event, managedUser)}
                >
                  <label>
                    <span>{managedUser.isSuperuser ? "Perfil global" : "Perfil para los barcos seleccionados"}</span>
                    <select
                      onChange={(event) => setEditRole(event.target.value as AppRole)}
                      value={editRole}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {hasMixedRoles(managedUser) && (
                      <small className="field-hint">
                        Ahora tiene perfiles distintos. Al guardar se aplicara este perfil a todos sus barcos.
                      </small>
                    )}
                  </label>
                  <label>
                    <span>Nueva contrasena</span>
                    <input
                      autoComplete="new-password"
                      minLength={6}
                      onChange={(event) => setEditPassword(event.target.value)}
                      placeholder="Dejar en blanco para no cambiar"
                      type="password"
                      value={editPassword}
                    />
                    {managedUser.inviteStatus === "pending" && (
                      <small className="field-hint">
                        Al definir una contrasena se marcara la invitacion como aceptada.
                      </small>
                    )}
                  </label>
                  {managedUser.inviteStatus === "pending" && (
                    <label className="inline-checkbox">
                      <input
                        checked={editAcceptInvite}
                        onChange={(event) => setEditAcceptInvite(event.target.checked)}
                        type="checkbox"
                      />
                      <span>Marcar invitacion como aceptada</span>
                    </label>
                  )}
                  {editRole === "superuser" ? (
                    <p className="field-hint">
                      El administrador total tiene acceso global. No necesita barcos asignados.
                    </p>
                  ) : (
                    <div>
                      <span className="field-label">Barcos asignados</span>
                      <BoatAccessPicker
                        boats={boats}
                        onToggle={(boatId) => setEditBoatIds((current) => toggleBoat(current, boatId))}
                        selectedBoatIds={editBoatIds}
                      />
                    </div>
                  )}
                  <button disabled={updatingUserId === managedUser.id} type="submit">
                    {updatingUserId === managedUser.id ? "Guardando..." : "Actualizar usuario"}
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <p>Selecciona un usuario para cambiar su perfil, barcos o contrasena.</p>
              </div>
            )}
          </aside>
        </div>
      </article>
    </section>
  );
}
