import { useState } from "react";
import type { TaskAttachment } from "../lib/types";
import * as db from "../lib/db";

function Lightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)", display: "grid", placeItems: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "grid", gap: "0.75rem", maxWidth: "90vw", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a
              href={url} target="_blank" rel="noopener noreferrer"
              style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", textDecoration: "underline" }}
              onClick={(e) => e.stopPropagation()}
            >
              Abrir original
            </a>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", borderRadius: "0.5rem", padding: "0.25rem 0.6rem", cursor: "pointer", fontSize: "1rem" }}
            >
              ✕
            </button>
          </div>
        </div>
        <img
          src={url} alt={name}
          style={{ maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "0.75rem" }}
        />
      </div>
    </div>
  );
}

export function AttachmentGallery({
  attachments,
  onDeleted,
  readOnly,
}: {
  attachments: TaskAttachment[];
  onDeleted?: (id: string) => void;
  readOnly?: boolean;
}) {
  const [lightbox, setLightbox] = useState<TaskAttachment | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const photos = attachments.filter((a) => a.documentCategory === "photo");
  const files = attachments.filter((a) => a.documentCategory === "file");

  async function handleDelete(att: TaskAttachment) {
    if (!confirm(`¿Eliminar "${att.fileName}"?`)) return;
    setDeleting(att.id);
    try {
      await db.deleteAttachment(att.id, att.storagePath);
      onDeleted?.(att.id);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {lightbox && lightbox.signedUrl && (
        <Lightbox url={lightbox.signedUrl} name={lightbox.fileName} onClose={() => setLightbox(null)} />
      )}

      {photos.length > 0 && (
        <div>
          <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: "0.35rem" }}>
            Fotografías
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {photos.map((att) => (
              <div key={att.id} style={{ position: "relative" }}>
                {att.signedUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightbox(att)}
                    style={{
                      display: "block", padding: 0, border: "1px solid var(--border)",
                      borderRadius: "0.5rem", overflow: "hidden", cursor: "zoom-in",
                      background: "none", lineHeight: 0,
                    }}
                    title={att.fileName}
                  >
                    <img
                      src={att.signedUrl} alt={att.fileName}
                      style={{ width: "72px", height: "72px", objectFit: "cover", display: "block" }}
                    />
                  </button>
                ) : (
                  <div style={{ width: "72px", height: "72px", background: "var(--input-bg)", borderRadius: "0.5rem", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--text-soft)", fontSize: "0.7rem" }}>
                    Sin URL
                  </div>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att)}
                    disabled={deleting === att.id}
                    style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "var(--danger)", border: "none", color: "white",
                      cursor: "pointer", fontSize: "0.65rem", display: "grid", placeItems: "center",
                      lineHeight: 1, padding: 0,
                    }}
                    title="Eliminar foto"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: "0.35rem" }}>
            Archivos
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {files.map((att) => (
              <div key={att.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {att.signedUrl ? (
                  <a
                    href={att.signedUrl} target="_blank" rel="noopener noreferrer"
                    className="pill"
                    style={{ textDecoration: "none", fontSize: "0.8rem" }}
                    title={att.fileName}
                  >
                    📎 {att.fileName}
                  </a>
                ) : (
                  <span className="pill" style={{ fontSize: "0.8rem" }}>📎 {att.fileName}</span>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att)}
                    disabled={deleting === att.id}
                    className="btn-icon"
                    style={{ width: "18px", height: "18px", fontSize: "0.65rem" }}
                    title="Eliminar archivo"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
