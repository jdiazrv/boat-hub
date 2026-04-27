import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAppData } from "../providers/AppDataProvider";
import { useActiveBoat } from "../providers/ActiveBoatProvider";

export function DashboardPage() {
  const { t } = useI18n();
  const { boats, allBoats, inventoryItems, inventoryItemsFull, maintenanceTasks, maintenanceTasksFull, preventiveTasks, preventiveTasksFull, source, error } = useAppData();
  const { activeBoatId, activeBoat } = useActiveBoat();

  const allBoatsList = isSupabaseConfigured ? allBoats : boats;
  const allMaintenance = isSupabaseConfigured ? maintenanceTasksFull : maintenanceTasks;
  const allPreventive = isSupabaseConfigured ? preventiveTasksFull : preventiveTasks;
  const allInventory = isSupabaseConfigured ? inventoryItemsFull : inventoryItems;

  const filteredMaintenance = activeBoatId ? allMaintenance.filter((t) => t.boatId === activeBoatId) : allMaintenance;
  const filteredPreventive = activeBoatId ? allPreventive.filter((t) => t.boatId === activeBoatId) : allPreventive;
  const filteredInventory = activeBoatId ? allInventory.filter((t) => t.boatId === activeBoatId) : allInventory;

  const overdueCount = filteredPreventive.filter((item) => item.state === "overdue").length;
  const dueSoonCount = filteredMaintenance.filter((item) => item.status !== "done").length;
  const lowStockCount = filteredInventory.filter((item) => item.stock < (item.minimumStock ?? item.minimum ?? 0)).length;

  const boatLabel = activeBoat ? activeBoat.name : allBoatsList.length > 0 ? "Todos los barcos" : "Sin barcos";

  return (
    <section className="page">
      {error && (
        <div className="banner warning-banner">
          <strong>Supabase fallback</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="hero-card">
        <div>
          <span className="eyebrow">{t("overview")}</span>
          <h2>{boatLabel}</h2>
          <p>
            Gestión multibarco con independencia total de datos, preventivos, varadas, inventario
            y trazabilidad técnica completa.
          </p>
          <p className="inline-note">
            Fuente de datos: <strong>{source === "supabase" ? "Supabase" : "Demo seed"}</strong>
          </p>
        </div>
        <div className="hero-grid">
          <article className="metric-card">
            <strong>{dueSoonCount}</strong>
            <span>{t("tasks")}</span>
          </article>
          <article className="metric-card">
            <strong>{overdueCount}</strong>
            <span>{t("overdue")}</span>
          </article>
          <article className="metric-card">
            <strong>{lowStockCount}</strong>
            <span>Stock bajo</span>
          </article>
        </div>
      </div>

      <div className="grid-two">
        <article className="panel-card">
          <div className="panel-head">
            <h3>{t("upcomingActions")}</h3>
            <span className="pill warning">{t("dueSoon")}</span>
          </div>
          <div className="list-stack">
            {filteredMaintenance.slice(0, 6).map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.systemName} · {task.responsible ?? task.performedBy ?? "Sin asignar"}
                  </p>
                </div>
                <span>{task.dueDate ?? "-"}</span>
              </div>
            ))}
            {filteredMaintenance.length === 0 && <p style={{ color: "var(--text-soft)", margin: 0 }}>Sin tareas.</p>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h3>{t("preventiveBoard")}</h3>
            <span className="pill critical">{t("overdue")}</span>
          </div>
          <div className="list-stack">
            {filteredPreventive.slice(0, 6).map((task) => (
              <div className="list-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.systemName} · {task.rule}
                  </p>
                </div>
                <span>{task.nextDueDate ?? "-"}</span>
              </div>
            ))}
            {filteredPreventive.length === 0 && <p style={{ color: "var(--text-soft)", margin: 0 }}>Sin preventivos.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
