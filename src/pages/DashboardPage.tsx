import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAppData } from "../providers/AppDataProvider";
import { useActiveBoat } from "../providers/ActiveBoatProvider";

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function priorityColor(priority: string): string {
  if (priority === "critical") return "var(--pill-critical, #ef4444)";
  if (priority === "high")     return "var(--pill-high, #f97316)";
  if (priority === "medium")   return "var(--pill-medium, #eab308)";
  return "var(--text-soft)";
}

export function DashboardPage() {
  const { t } = useI18n();
  const {
    boats, allBoats,
    inventoryItems, inventoryItemsFull,
    maintenanceTasks, maintenanceTasksFull,
    preventiveTasks, preventiveTasksFull,
    observations, futureActions, futurePurchases,
    haulOuts, hourLogs, fuelLogs, marinas, shipyards,
    error,
  } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();

  const allBoatsList   = isSupabaseConfigured ? allBoats : boats;
  const allMaintenance = isSupabaseConfigured ? maintenanceTasksFull : maintenanceTasks;
  const allPreventive  = isSupabaseConfigured ? preventiveTasksFull  : preventiveTasks;
  const allInventory   = isSupabaseConfigured ? inventoryItemsFull   : inventoryItems;

  const filterBoat = <T extends { boatId: string }>(arr: T[]) =>
    activeBoatId ? arr.filter((x) => x.boatId === activeBoatId) : arr;

  const myMaintenance   = filterBoat(allMaintenance);
  const myPreventive    = filterBoat(allPreventive);
  const myInventory     = filterBoat(allInventory);
  const myHourLogs      = filterBoat(hourLogs);
  const myFuelLogs      = filterBoat(fuelLogs);
  const myObservations  = filterBoat(observations);
  const myFutureActions = filterBoat(futureActions);
  const myPurchases     = filterBoat(futurePurchases);
  const myHaulOuts      = filterBoat(haulOuts);

  // Pending tasks (not done/cancelled)
  const pendingTasks   = myMaintenance.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const overduePerio   = myPreventive.filter((t) => t.state === "overdue");
  const openObs        = myObservations.filter((o) => o.status === "open");
  const lowStock       = myInventory.filter((i) => i.stock != null && i.minimumStock != null && i.stock < i.minimumStock);

  // Latest hour log per counter
  const latestByCounter = Object.values(
    myHourLogs.reduce<Record<string, typeof myHourLogs[0]>>((acc, log) => {
      if (!acc[log.hourCounterId] || log.loggedAt > acc[log.hourCounterId].loggedAt) {
        acc[log.hourCounterId] = log;
      }
      return acc;
    }, {})
  ).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  // Latest fuel log
  const latestFuel = [...myFuelLogs].sort((a, b) => b.fuelledAt.localeCompare(a.fuelledAt))[0] ?? null;

  // Upcoming haul-out
  const nextHaulOut = myHaulOuts
    .filter((h) => h.status === "planned" || h.status === "preparing")
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0] ?? null;

  const boatLabel = activeBoat ? activeBoat.name : allBoatsList.length > 0 ? "Todos los barcos" : "Sin barcos";
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="page">
      {error && (
        <div className="banner warning-banner">
          <strong>Supabase fallback</strong>
          <span>{error}</span>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">{t("overview")}</span>
          <h2 style={{ margin: "0.15rem 0 0" }}>{boatLabel}</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "var(--text-soft)", paddingTop: "0.35rem" }}>{today}</span>
      </div>

      {/* ── Pills resumen ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <Link to="/maintenance" className="dash-pill" data-warn={pendingTasks.length > 0 || undefined}>
          {pendingTasks.length} tareas pendientes
        </Link>
        <Link to="/preventive" className="dash-pill" data-warn={overduePerio.length > 0 || undefined}>
          {overduePerio.length} periódicos vencidos
        </Link>
        <Link to="/observations" className="dash-pill" data-warn={openObs.length > 0 || undefined}>
          {openObs.length} observaciones abiertas
        </Link>
        {lowStock.length > 0 && (
          <Link to="/inventory" className="dash-pill" data-warn>
            {lowStock.length} stock bajo mínimo
          </Link>
        )}
        <Link to="/purchases" className="dash-pill">
          {myPurchases.filter(p => p.status !== "cancelled" && p.status !== "received").length} compras pendientes
        </Link>
        <Link to="/future-actions" className="dash-pill">
          {myFutureActions.filter(a => a.status !== "done" && a.status !== "cancelled").length} acciones futuras
        </Link>
        {nextHaulOut && (
          <Link to="/haul-outs" className="dash-pill">
            Próxima varada: {fmt(nextHaulOut.startDate)}
          </Link>
        )}
        <Link to="/marinas" className="dash-pill dash-pill--neutral">
          {marinas.length} marinas
        </Link>
        <Link to="/shipyards" className="dash-pill dash-pill--neutral">
          {shipyards.length} varaderos
        </Link>
        <Link to="/inventory" className="dash-pill dash-pill--neutral">
          {myInventory.length} elementos inventario
        </Link>
      </div>

      {/* ── Grid principal ── */}
      <div className="grid-two">

        {/* Últimas horas de motor */}
        <article className="panel-card">
          <div className="panel-head">
            <h3>Horas de motor</h3>
            <Link to="/hours" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Ver registro →</Link>
          </div>
          <div className="list-stack" style={{ gap: "0.25rem" }}>
            {latestByCounter.length === 0 && <p style={{ color: "var(--text-soft)", margin: 0 }}>Sin registros.</p>}
            {latestByCounter.map((log) => (
              <div className="list-row" key={log.id} style={{ padding: "0.25rem 0" }}>
                <span style={{ fontSize: "0.9rem" }}>{log.counterName}</span>
                <span style={{ fontSize: "0.9rem" }}>
                  <strong>{log.hours.toLocaleString("es-ES")} h</strong>
                  <span style={{ color: "var(--text-soft)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>{fmt(log.loggedAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Última carga de combustible */}
        <article className="panel-card">
          <div className="panel-head">
            <h3>Combustible</h3>
            <Link to="/fuel" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Ver registro →</Link>
          </div>
          {latestFuel ? (
            <div className="list-row" style={{ padding: "0.25rem 0", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "0.9rem" }}>{fmt(latestFuel.fuelledAt)}</span>
              <span style={{ fontSize: "0.9rem" }}>
                <strong>{latestFuel.quantity.toLocaleString("es-ES")} {latestFuel.unit}</strong>
                {latestFuel.totalCost != null && (
                  <span style={{ color: "var(--text-soft)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                    {latestFuel.totalCost.toLocaleString("es-ES")} €
                  </span>
                )}
              </span>
            </div>
          ) : (
            <p style={{ color: "var(--text-soft)", margin: "0.25rem 0 0" }}>Sin registros de combustible.</p>
          )}
        </article>

        {/* Tareas urgentes */}
        <article className="panel-card">
          <div className="panel-head">
            <h3>{t("upcomingActions")}</h3>
            <Link to="/maintenance" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Ver todas →</Link>
          </div>
          <div className="list-stack" style={{ gap: "0.25rem" }}>
            {pendingTasks.slice(0, 6).map((task) => (
              <Link to="/maintenance" className="list-row dash-list-row" key={task.id} style={{ padding: "0.25rem 0" }}>
                <strong style={{ fontSize: "0.9rem" }}>{task.title}</strong>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.82rem" }}>{fmt(task.dueDate)}</span>
                  {task.priority && (
                    <span style={{ display: "block", fontSize: "0.72rem", color: priorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {pendingTasks.length === 0 && <p style={{ color: "var(--text-soft)", margin: 0 }}>Sin tareas pendientes.</p>}
          </div>
        </article>

        {/* Periódicos vencidos */}
        <article className="panel-card">
          <div className="panel-head">
            <h3>Periódicos vencidos</h3>
            <Link to="/preventive" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Ver todos →</Link>
          </div>
          <div className="list-stack" style={{ gap: "0.25rem" }}>
            {overduePerio.slice(0, 6).map((task) => (
              <Link to="/preventive" className="list-row dash-list-row" key={task.id} style={{ padding: "0.25rem 0" }}>
                <strong style={{ fontSize: "0.9rem" }}>{task.title}</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--pill-critical, #ef4444)", flexShrink: 0 }}>{fmt(task.nextDueDate)}</span>
              </Link>
            ))}
            {overduePerio.length === 0 && <p style={{ color: "var(--text-soft)", margin: 0 }}>Todo al día.</p>}
          </div>
        </article>

      </div>
    </section>
  );
}
