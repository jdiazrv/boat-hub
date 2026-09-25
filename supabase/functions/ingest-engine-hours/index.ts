// Lectura automática del contador de horas desde el barco (REWIND,
// 2026-09-25): el plugin de Signal K la manda al apagar el motor.
//
// No hay sesión: el aparato se identifica con su token (cabecera
// x-device-token, o Authorization: Bearer). Se despliega SIN verificar JWT
// (el token no es un JWT de Supabase):
//
//   supabase functions deploy ingest-engine-hours --no-verify-jwt
//
// El token solo sirve para añadir lecturas a SU contador. Se busca por su
// hash en hour_counter_devices; un token revocado ya no vale.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-device-token, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Diferencias menores que esto son la misma lectura (el aparato reintenta
// o el motor apenas se encendió).
const SAME_READING_H = 0.05;
// Un contador de horas no va hacia atrás; un poco sí se tolera (redondeos
// de otro aparato o una lectura a mano con decimales distintos).
const BACKWARDS_TOLERANCE_H = 0.5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Solo POST" });

  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const token = (req.headers.get("x-device-token") ?? bearer).trim();
  if (!token.startsWith("blg_")) return json(401, { error: "Falta el token del aparato" });

  let body: { hours?: unknown; loggedAt?: unknown; location?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "JSON no válido" });
  }
  const hours = Number(body.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 1_000_000) {
    return json(400, { error: "Horas no válidas" });
  }
  let loggedAt = new Date();
  if (typeof body.loggedAt === "string") {
    const d = new Date(body.loggedAt);
    // Ni del futuro (más de 10 min) ni de hace más de un año.
    const now = Date.now();
    if (!Number.isNaN(d.getTime()) && d.getTime() <= now + 600_000 && d.getTime() >= now - 366 * 86_400_000) {
      loggedAt = d;
    }
  }
  const location = typeof body.location === "string" ? body.location.slice(0, 120) : null;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: device, error: devErr } = await admin
    .from("hour_counter_devices")
    .select("id, boat_id, hour_counter_id, name, revoked_at")
    .eq("token_hash", await sha256Hex(token))
    .maybeSingle();
  if (devErr) return json(500, { error: "Error al buscar el aparato" });
  if (!device || device.revoked_at) return json(401, { error: "Token no válido o revocado" });

  const { data: last } = await admin
    .from("engine_hour_logs")
    .select("value_hours")
    .eq("hour_counter_id", device.hour_counter_id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastH = last ? Number(last.value_hours) : null;

  const touch = () =>
    admin
      .from("hour_counter_devices")
      .update({ last_used_at: new Date().toISOString(), last_value_hours: hours })
      .eq("id", device.id);

  if (lastH !== null && Math.abs(lastH - hours) < SAME_READING_H) {
    await touch();
    return json(200, { ok: true, stored: false, reason: "misma lectura" });
  }
  if (lastH !== null && hours < lastH - BACKWARDS_TOLERANCE_H) {
    return json(409, {
      error: `La lectura (${hours.toFixed(1)} h) es menor que la última (${lastH.toFixed(1)} h)`,
    });
  }

  const { error: insErr } = await admin.from("engine_hour_logs").insert({
    boat_id: device.boat_id,
    hour_counter_id: device.hour_counter_id,
    logged_at: loggedAt.toISOString(),
    value_hours: Math.round(hours * 100) / 100,
    location,
    notes: `Automático · ${device.name}`,
  });
  if (insErr) return json(500, { error: "No se pudo guardar la lectura" });
  await touch();
  return json(200, { ok: true, stored: true });
});
