import { useState } from "react";
import { useI18n } from "../lib/i18n";

// ─── useSelectMode ────────────────────────────────────────────────────────────
// Hook that encapsulates all multi-select state logic.

export function useSelectMode() {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function enterSelectMode() { setSelectMode(true); }

  function exitSelectMode() { setSelectMode(false); setSelected(new Set()); }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll(ids: string[]) {
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  return { selectMode, selected, setSelected, enterSelectMode, exitSelectMode, toggleOne, toggleAll };
}

// ─── SelectModeHeaderButtons ──────────────────────────────────────────────────
// Renders in page-header: "Seleccionar" button (normal mode) or "Cancelar" (select mode).
// Place alongside the primary action button.

export function SelectModeHeaderButtons({
  selectMode,
  onEnter,
  onCancel,
  children,
}: {
  selectMode: boolean;
  onEnter: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {!selectMode && (
        <button className="btn-ghost" type="button" onClick={onEnter}>{t("selectMode")}</button>
      )}
      {selectMode && (
        <button className="btn-ghost" type="button" onClick={onCancel}>{t("cancelSelection")}</button>
      )}
      {!selectMode && children}
    </div>
  );
}

// ─── SelectAllCheckbox ────────────────────────────────────────────────────────
// Goes in the first cell of data-table-head.
// Shows nothing when not in select mode.

export function SelectAllCheckbox({
  selectMode,
  ids,
  selected,
  onToggleAll,
}: {
  selectMode: boolean;
  ids: string[];
  selected: Set<string>;
  onToggleAll: (ids: string[]) => void;
}) {
  if (!selectMode) return <span />;
  return (
    <input
      type="checkbox"
      checked={ids.length > 0 && ids.every((id) => selected.has(id))}
      disabled={ids.length === 0}
      onChange={() => onToggleAll(ids)}
      style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
    />
  );
}

// ─── SelectRowCheckbox ────────────────────────────────────────────────────────
// Goes in the first cell of each data-table-row.

export function SelectRowCheckbox({
  selectMode,
  id,
  selected,
  onToggle,
  disabled,
}: {
  selectMode: boolean;
  id: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  if (!selectMode) return <span />;
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      disabled={disabled}
      onChange={() => onToggle(id)}
      onClick={(e) => e.stopPropagation()}
      style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
    />
  );
}

// ─── BulkDeleteBar ────────────────────────────────────────────────────────────
// Floating bar at the bottom when items are selected.

export function BulkDeleteBar({
  selectMode,
  selected,
  deleting,
  onDelete,
  onCancel,
  label,
}: {
  selectMode: boolean;
  selected: Set<string>;
  deleting: boolean;
  onDelete: () => void;
  onCancel: () => void;
  label?: string; // e.g. "observación" → "3 observaciones"
}) {
  const { t } = useI18n();

  if (!selectMode || selected.size === 0) return null;

  const count = selected.size;
  const noun = label ?? t("selectMode").toLowerCase();
  const plural = count !== 1 ? `${noun}s` : noun;

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      background: "var(--danger)", color: "#fff", borderRadius: "2rem",
      padding: "0.6rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 50, whiteSpace: "nowrap",
    }}>
      <span style={{ fontWeight: 600 }}>{count} {plural}</span>
      <button
        className="btn-ghost"
        style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
        onClick={onCancel}
        disabled={deleting}
      >
        {t("cancelSelection")}
      </button>
      <button
        className="btn-primary"
        style={{ background: "#fff", color: "var(--danger)", border: "none" }}
        onClick={onDelete}
        disabled={deleting}
      >
        {deleting ? t("deleting") : t("delete")}
      </button>
    </div>
  );
}
