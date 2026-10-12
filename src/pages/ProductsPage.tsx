import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckboxField, FormActions, FormGrid, FormSection, InputField, SelectField, TextareaField } from "../components/FormField";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Modal } from "../components/Modal";
import * as db from "../lib/db";
import { useI18n } from "../lib/i18n";
import { isSupabaseConfigured } from "../lib/supabase";
import type { BoatProduct, BoatProductNote, BoatProductPhoto, BoatProductStatus } from "../lib/types";
import { useActiveBoat } from "../providers/ActiveBoatProvider";
import { useAppData } from "../providers/AppDataProvider";

type ProductPayload = Omit<BoatProduct, "id" | "photos" | "coverAttachmentId">;

const STATUS_ORDER: BoatProductStatus[] = ["ok", "low", "dont_restock", "missing"];
const GROUP_COLORS = ["#c27a00", "#5b4bb0", "#0f7a86", "#4b6c8f", "#a14d7a", "#7a6a2a", "#2f7a3d", "#9a3b3b"];

function useStatusLabels() {
  const { t } = useI18n();
  return {
    ok: t("prodStatusOk"),
    low: t("prodStatusLow"),
    dont_restock: t("prodStatusDontRestock"),
    missing: t("prodStatusMissing"),
  } satisfies Record<BoatProductStatus, string>;
}

function norm(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function safeUrl(url: string | null) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

/** Main photo: the chosen one, else the first own photo, else the first catalog photo. */
function coverOf(p: BoatProduct): BoatProductPhoto | null {
  return (
    p.photos.find((ph) => ph.id === p.coverAttachmentId) ??
    p.photos.find((ph) => ph.kind === "own") ??
    p.photos[0] ??
    null
  );
}

// ─── Lightbox: the product's photos, own and catalog side by side ────────────

function ProductLightbox({ products, index, onIndex, onClose }: {
  products: BoatProduct[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const p = products[index];
  const go = useCallback((d: number) => onIndex((index + d + products.length) % products.length), [index, products.length, onIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!p) return null;
  const own = p.photos.filter((ph) => ph.kind === "own");
  const catalog = p.photos.filter((ph) => ph.kind === "catalog");
  const shown = [...own, ...catalog];

  return (
    <div className="prod-lightbox" onClick={onClose} role="dialog" aria-label={p.name}>
      <div className="prod-lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <span>{p.number != null ? `${p.number} · ` : ""}{p.name}</span>
        <button type="button" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>
      <div className="prod-lightbox-photos">
        {shown.length === 0 && <div className="prod-lightbox-empty">{t("prodNoPhoto")}</div>}
        {shown.map((ph) => (
          <figure key={ph.id} onClick={(e) => e.stopPropagation()}>
            {ph.signedUrl ? <img src={ph.signedUrl} alt={ph.fileName} /> : <div className="prod-lightbox-empty">—</div>}
            <figcaption>{ph.kind === "own" ? t("prodOwnPhoto") : t("prodCatalogPhoto")}</figcaption>
          </figure>
        ))}
      </div>
      {products.length > 1 && (
        <>
          <button type="button" className="prod-lightbox-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Anterior">‹</button>
          <button type="button" className="prod-lightbox-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Siguiente">›</button>
        </>
      )}
    </div>
  );
}

// ─── Product form ─────────────────────────────────────────────────────────────

function ProductForm({ initial, product, groups, locations, onSave, onDelete, onCancel, onPhotosChanged, loading, error }: {
  initial: ProductPayload;
  product: BoatProduct | null;
  groups: string[];
  locations: string[];
  onSave: (data: ProductPayload, ownFiles: File[], catalogFiles: File[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onPhotosChanged: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const statusLabels = useStatusLabels();
  const [form, setForm] = useState(initial);
  const [ownFiles, setOwnFiles] = useState<File[]>([]);
  const [catalogFiles, setCatalogFiles] = useState<File[]>([]);
  const [busyPhoto, setBusyPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function set<K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }
  const text = (v: string) => (v.trim() ? v : null);

  async function photoAction(id: string, action: () => Promise<void>) {
    setBusyPhoto(id); setPhotoError(null);
    try { await action(); onPhotosChanged(); }
    catch (err) { setPhotoError(err instanceof Error ? err.message : "Error"); }
    finally { setBusyPhoto(null); }
  }

  const cover = product ? coverOf(product) : null;

  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(form, ownFiles, catalogFiles); }}>
      <FormSection>
        <div className="prod-form-head">
          <InputField
            label={t("prodNo")} type="number" min={0}
            value={form.number ?? ""}
            onChange={(e) => set("number", e.target.value === "" ? null : Number(e.target.value))}
          />
          <InputField label={t("prodName")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <FormGrid>
          <InputField label={t("prodType")} value={form.productType ?? ""} onChange={(e) => set("productType", text(e.target.value))} />
          <InputField label={t("prodGroup")} list="prod-groups" value={form.groupName ?? ""} onChange={(e) => set("groupName", text(e.target.value))} />
          <InputField label={t("prodLocation")} list="prod-locations" value={form.location ?? ""} onChange={(e) => set("location", text(e.target.value))} />
          <SelectField label={t("prodStatus")} value={form.status} onChange={(e) => set("status", e.target.value as BoatProductStatus)}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </SelectField>
        </FormGrid>
        <datalist id="prod-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        <datalist id="prod-locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
        <TextareaField label={t("prodUsage")} rows={2} value={form.usage ?? ""} onChange={(e) => set("usage", text(e.target.value))} />
        <TextareaField label={t("prodOnFinish")} rows={2} value={form.onFinish ?? ""} onChange={(e) => set("onFinish", text(e.target.value))} />
        <InputField label={t("prodLink")} type="url" placeholder="https://" value={form.linkUrl ?? ""} onChange={(e) => set("linkUrl", text(e.target.value))} />
        <CheckboxField label={t("prodWinterizingHint")} checked={form.winterizing} onChange={(e) => set("winterizing", e.target.checked)} />
        <TextareaField label={t("prodNotes")} rows={3} value={form.notes ?? ""} onChange={(e) => set("notes", text(e.target.value))} />
      </FormSection>

      <FormSection title={t("prodPhotos")}>
        {product && product.photos.length > 0 && (
          <div className="prod-photo-grid">
            {product.photos.map((ph) => (
              <div key={ph.id} className={`prod-photo-item${cover?.id === ph.id ? " is-cover" : ""}`}>
                {ph.signedUrl ? <img src={ph.signedUrl} alt={ph.fileName} /> : <div className="prod-thumb-empty">—</div>}
                <span className="prod-photo-kind">{ph.kind === "own" ? t("prodOwnPhoto") : t("prodCatalogPhoto")}</span>
                <div className="prod-photo-actions">
                  <button
                    type="button" className="btn-icon" title={t("prodMakeCover")} disabled={busyPhoto === ph.id || cover?.id === ph.id}
                    onClick={() => photoAction(ph.id, () => db.setBoatProductCover(product.id, ph.id))}
                  >★</button>
                  <button
                    type="button" className="btn-icon" title={t("prodToggleKind")} disabled={busyPhoto === ph.id}
                    onClick={() => photoAction(ph.id, () => db.setBoatProductPhotoKind(ph.id, ph.kind === "own" ? "catalog" : "own"))}
                  >⇄</button>
                  <button
                    type="button" className="btn-icon" title={t("delete")} disabled={busyPhoto === ph.id}
                    onClick={() => {
                      if (!confirm(`${t("confirmDeleteFile")} "${ph.fileName}"?`)) return;
                      void photoAction(ph.id, async () => {
                        if (product.coverAttachmentId === ph.id) await db.setBoatProductCover(product.id, null);
                        await db.deleteAttachment(ph.id, ph.storagePath);
                      });
                    }}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {photoError && <p className="form-error">{photoError}</p>}
        <FormGrid>
          <InputField
            label={t("prodAddOwnPhoto")} type="file" accept="image/*" capture="environment" multiple
            onChange={(e) => setOwnFiles(Array.from(e.target.files ?? []))}
          />
          <InputField
            label={t("prodAddCatalogPhoto")} type="file" accept="image/*" multiple
            onChange={(e) => setCatalogFiles(Array.from(e.target.files ?? []))}
          />
        </FormGrid>
      </FormSection>

      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} danger={!!onDelete} onDanger={onDelete} />
    </form>
  );
}

// ─── Note form ────────────────────────────────────────────────────────────────

function NoteForm({ initial, onSave, onDelete, onCancel, loading, error }: {
  initial: { title: string; body: string | null };
  onSave: (title: string, body: string | null) => void;
  onDelete?: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body ?? "");
  return (
    <form className="form-stack" onSubmit={(e) => { e.preventDefault(); onSave(title.trim(), body.trim() ? body : null); }}>
      <InputField label={t("prodNoteTitle")} required value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextareaField label={t("prodNoteBody")} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      <FormActions onCancel={onCancel} loading={loading} disabled={!title.trim()} danger={!!onDelete} onDanger={onDelete} />
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const { t } = useI18n();
  const statusLabels = useStatusLabels();
  const { activeBoatId, activeBoat } = useActiveBoat();
  const { refresh: refreshAppData } = useAppData();
  const [products, setProducts] = useState<BoatProduct[]>([]);
  const [notes, setNotes] = useState<BoatProductNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState<BoatProductStatus | "">("");
  const [editing, setEditing] = useState<BoatProduct | "new" | null>(null);
  const [editingNote, setEditingNote] = useState<BoatProductNote | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [sentToPurchases, setSentToPurchases] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!activeBoatId || !isSupabaseConfigured) return;
    setLoading(true); setLoadError(null);
    try {
      const [prods, boxNotes] = await Promise.all([db.fetchBoatProducts(activeBoatId), db.fetchBoatProductNotes(activeBoatId)]);
      setProducts(prods);
      setNotes(boxNotes);
      // Keep the open form in sync after a photo change.
      setEditing((cur) => (cur && cur !== "new" ? prods.find((p) => p.id === cur.id) ?? null : cur));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [activeBoatId]);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    // Groups in the order of their lowest product number.
    const first = new Map<string, number>();
    for (const p of products) {
      const g = p.groupName ?? "";
      first.set(g, Math.min(first.get(g) ?? Infinity, p.number ?? Infinity));
    }
    return [...first.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([g]) => g);
  }, [products]);
  const groupColor = (g: string) => (g ? GROUP_COLORS[groups.filter(Boolean).indexOf(g) % GROUP_COLORS.length] : "var(--text-soft)");
  const locations = useMemo(() => [...new Set(products.map((p) => p.location).filter((l): l is string => !!l))].sort(), [products]);

  const words = norm(query).split(/\s+/).filter(Boolean);
  const visible = products.filter((p) => {
    if (filterGroup && (p.groupName ?? "") !== filterGroup) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (!words.length) return true;
    const hay = norm([p.number, p.name, p.productType, p.usage, p.groupName, p.location, p.onFinish, p.notes].filter(Boolean).join(" "));
    return words.every((w) => hay.includes(w));
  });
  const onBoard = visible.filter((p) => p.status !== "missing");
  const missing = visible.filter((p) => p.status === "missing");

  function emptyPayload(): ProductPayload {
    const maxNumber = products.reduce((m, p) => Math.max(m, p.number ?? 0), 0);
    return {
      boatId: activeBoatId ?? "", number: maxNumber + 1, name: "", productType: null, usage: null,
      groupName: filterGroup || null, location: null, status: "ok", onFinish: null, linkUrl: null,
      winterizing: false, notes: null,
    };
  }

  async function handleSave(data: ProductPayload, ownFiles: File[], catalogFiles: File[]) {
    if (!activeBoatId) return;
    setSaving(true); setFormError(null);
    try {
      const payload = { ...data, boatId: activeBoatId, name: data.name.trim() };
      let id: string;
      if (editing && editing !== "new") { id = editing.id; await db.updateBoatProduct(id, payload); }
      else id = await db.createBoatProduct(payload);
      if (ownFiles.length) await db.uploadBoatProductPhotos(activeBoatId, id, ownFiles, "own");
      if (catalogFiles.length) await db.uploadBoatProductPhotos(activeBoatId, id, catalogFiles, "catalog");
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || editing === "new" || !confirm(t("prodConfirmDelete"))) return;
    setSaving(true); setFormError(null);
    try { await db.deleteBoatProduct(editing); setEditing(null); await load(); }
    catch (err) { setFormError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function handleSaveNote(title: string, body: string | null) {
    if (!activeBoatId || !editingNote) return;
    setSaving(true); setFormError(null);
    try {
      await db.saveBoatProductNote({
        id: editingNote === "new" ? undefined : editingNote.id,
        boatId: activeBoatId, title, body,
        sortOrder: editingNote === "new" ? notes.reduce((m, n) => Math.max(m, n.sortOrder), 0) + 1 : editingNote.sortOrder,
      });
      setEditingNote(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote() {
    if (!editingNote || editingNote === "new" || !confirm(t("prodConfirmDeleteNote"))) return;
    setSaving(true);
    try { await db.deleteBoatProductNote(editingNote.id); setEditingNote(null); await load(); }
    catch (err) { setFormError(err instanceof Error ? err.message : "Error"); }
    finally { setSaving(false); }
  }

  async function sendToPurchases(p: BoatProduct) {
    try {
      await db.createFuturePurchase({
        boatId: p.boatId, boatSystemId: null, observationId: null, articleName: p.name,
        description: [p.productType, p.usage].filter(Boolean).join(" · ") || null,
        quantity: 1, unit: null, priority: "medium", status: "pending", supplier: null,
        estimatedCost: null, targetDate: null, notes: safeUrl(p.linkUrl) ?? p.notes,
      });
      setSentToPurchases((s) => new Set(s).add(p.id));
      void refreshAppData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  const header = (
    <div className="section-title">
      <span className="eyebrow">{t("products")}{activeBoat ? ` · ${activeBoat.name}` : ""}</span>
      <h2>{t("prodBoard")}</h2>
    </div>
  );

  if (!activeBoatId || !isSupabaseConfigured) {
    return (
      <section className="page">
        {header}
        <div className="empty-state"><p>{!isSupabaseConfigured ? t("prodDemo") : t("prodSelectBoat")}</p></div>
      </section>
    );
  }

  // Lightbox walks through the visible products that have photos.
  const withPhotos = visible.filter((p) => p.photos.length > 0);

  function renderRow(p: BoatProduct) {
    const cover = coverOf(p);
    const link = safeUrl(p.linkUrl);
    const color = groupColor(p.groupName ?? "");
    return (
      <div key={p.id} className="prod-row" onClick={() => { setFormError(null); setEditing(p); }}>
        <span className="prod-num"><b className="prod-badge" style={{ background: p.status === "missing" ? "var(--danger)" : color }}>{p.number ?? "–"}</b></span>
        <span className="prod-photo">
          {cover?.signedUrl ? (
            <button
              type="button" className="prod-thumb" title={p.name}
              onClick={(e) => { e.stopPropagation(); setLightbox(withPhotos.indexOf(p)); }}
            >
              <img src={cover.signedUrl} alt="" loading="lazy" />
            </button>
          ) : <span className="prod-thumb-empty">{t("prodNoPhoto")}</span>}
        </span>
        <span className="prod-name">
          <strong>{p.name}</strong>
          {link && <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="prod-link">{t("prodOpenLink")}</a>}
          {p.location && <small className="prod-where">{p.location}</small>}
        </span>
        <span className="prod-type">{p.productType}</span>
        <span className="prod-usage">
          {p.usage}
          {p.winterizing && <span className="prod-tag">{t("prodWinterizing")}</span>}
          {p.notes && <small className="prod-notes">{p.notes}</small>}
        </span>
        <span className="prod-finish">
          {p.status === "missing" ? (
            sentToPurchases.has(p.id)
              ? <span className="prod-ok">✓ {t("prodAddedToPurchases")}</span>
              : <button type="button" className="btn-ghost prod-buy" onClick={(e) => { e.stopPropagation(); void sendToPurchases(p); }}>{t("prodToPurchases")}</button>
          ) : (
            <>
              {p.status !== "ok" && <span className={`prod-status s-${p.status}`}>{statusLabels[p.status]}</span>}
              {p.onFinish ? <span className="prod-note">↻ {p.onFinish}</span> : p.status === "ok" && <span className="prod-ok">✓</span>}
            </>
          )}
        </span>
      </div>
    );
  }

  const groupedOnBoard = groups
    .map((g) => ({ g, items: onBoard.filter((p) => (p.groupName ?? "") === g) }))
    .filter((x) => x.items.length > 0);

  const tableHead = (
    <div className="prod-row prod-head">
      <span>{t("prodNo")}</span><span>{t("prodPhoto")}</span><span>{t("prodName")}</span>
      <span>{t("prodType")}</span><span>{t("prodUsage")}</span><span>{t("prodOnFinish")}</span>
    </div>
  );

  return (
    <section className="page">
      <div className="page-header">
        {header}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn-ghost" type="button" onClick={() => { setFormError(null); setEditingNote("new"); }}>{t("prodAddNote")}</button>
          <button className="btn-primary" type="button" onClick={() => { setFormError(null); setEditing("new"); }}>{t("prodAdd")}</button>
        </div>
      </div>
      <p className="data-table-cell-muted" style={{ marginTop: 0 }}>{t("prodIntro")}</p>

      <div className="filter-bar">
        <input className="form-input" type="search" placeholder={t("prodSearch")} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="form-input form-select" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">{t("prodAllGroups")}</option>
          {groups.filter(Boolean).map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="form-input form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as BoatProductStatus | "")}>
          <option value="">{t("prodAllStatuses")}</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
        <span className="data-table-cell-muted" aria-live="polite">
          {visible.length === products.length ? `${products.length} ${t("prodCount")}` : `${visible.length} ${t("prodOf")} ${products.length}`}
        </span>
      </div>

      {loadError && <p className="form-error">{loadError}</p>}

      <article className="panel-card prod-table">
        {loading && <LoadingOverlay />}
        {tableHead}
        {!loading && products.length === 0 && <div className="empty-state"><p>{t("prodEmpty")}</p></div>}
        {products.length > 0 && visible.length === 0 && <div className="empty-state"><p>{t("prodNoMatch")}</p></div>}
        {groupedOnBoard.map(({ g, items }) => (
          <div key={g || "_none"}>
            <div className="prod-group" style={{ borderColor: groupColor(g), color: groupColor(g) }}>{g || t("prodNoGroup")}</div>
            {items.map(renderRow)}
          </div>
        ))}
      </article>

      {missing.length > 0 && (
        <>
          <h3 className="prod-section-title">{t("prodMissingTitle")}</h3>
          <article className="panel-card prod-table prod-missing">{missing.map(renderRow)}</article>
        </>
      )}

      {notes.length > 0 && (
        <>
          <h3 className="prod-section-title">{t("prodNotesTitle")}</h3>
          <div className="prod-notes-grid">
            {notes.map((n) => (
              <article key={n.id} className="panel-card prod-note-card" onClick={() => { setFormError(null); setEditingNote(n); }}>
                <strong>{n.title}</strong>
                {n.body && <p>{n.body}</p>}
              </article>
            ))}
          </div>
        </>
      )}

      {lightbox !== null && withPhotos.length > 0 && (
        <ProductLightbox products={withPhotos} index={Math.max(0, lightbox)} onIndex={setLightbox} onClose={() => setLightbox(null)} />
      )}

      {editing && (
        <Modal title={editing === "new" ? t("prodNew") : t("prodEdit")} onClose={() => setEditing(null)} wide>
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? emptyPayload() : {
              boatId: editing.boatId, number: editing.number, name: editing.name, productType: editing.productType,
              usage: editing.usage, groupName: editing.groupName, location: editing.location, status: editing.status,
              onFinish: editing.onFinish, linkUrl: editing.linkUrl, winterizing: editing.winterizing, notes: editing.notes,
            }}
            product={editing === "new" ? null : editing}
            groups={groups.filter(Boolean)}
            locations={locations}
            onSave={handleSave}
            onDelete={editing === "new" ? undefined : handleDelete}
            onCancel={() => setEditing(null)}
            onPhotosChanged={() => void load()}
            loading={saving}
            error={formError}
          />
        </Modal>
      )}

      {editingNote && (
        <Modal title={editingNote === "new" ? t("prodNoteNew") : t("prodNoteEdit")} onClose={() => setEditingNote(null)}>
          <NoteForm
            initial={editingNote === "new" ? { title: "", body: null } : editingNote}
            onSave={handleSaveNote}
            onDelete={editingNote === "new" ? undefined : handleDeleteNote}
            onCancel={() => setEditingNote(null)}
            loading={saving}
            error={formError}
          />
        </Modal>
      )}
    </section>
  );
}
