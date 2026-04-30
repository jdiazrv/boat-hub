import { useState } from "react";
import { Modal } from "./Modal";
import type { BoatDimensions } from "../lib/types";

interface Props {
  dims: BoatDimensions;
  boatName?: string;
}

const WIND_COLORS = [
  "#6699cc",  // 6 kt  — blue
  "#44bbaa",  // 8 kt  — teal
  "#ffaa44",  // 10 kt — orange
  "#ee4444",  // 12 kt — red
  "#bb44bb",  // 14 kt — purple
  "#ff88cc",  // 16 kt — pink
  "#ffee44",  // 20 kt — yellow
];

function PolarSvg({ dims }: { dims: BoatDimensions }) {
  const rows  = dims.polarRows;
  const winds = dims.polarWindSpeeds ?? [6, 8, 10, 12, 14, 16, 20];

  if (!rows || rows.length === 0) return null;

  // ── Canvas: semicircle only (right half, 0°–180°) ──────────────────────────
  // Origin at left-centre, curves extend to the right
  const ox   = 120;   // origin x (left side, with room for speed labels)
  const oy   = 30;    // origin y (top)
  const maxR = 220;   // max radius in px
  const svgW = ox + maxR + 60;            // room for angle labels right
  const svgH = oy + maxR * 2 + winds.length * 22 + 80;  // room for 180° + legend

  const maxSpeed = Math.max(...rows.flatMap(r => r.speeds.filter(s => s > 0)));
  const toR = (spd: number) => (spd / maxSpeed) * maxR;

  // twa=0 → top (−y), twa=90 → right (+x), twa=180 → bottom (+y)
  function pt(twa: number, spd: number) {
    const r   = toR(spd);
    const rad = (twa * Math.PI) / 180 - Math.PI / 2;
    return {
      x: ox + r * Math.cos(rad),
      y: oy + maxR + r * Math.sin(rad) - maxR,  // offset so twa=0 is at top
    };
  }

  // Simpler: origin is at (ox, oy+maxR) so twa=0 goes straight up
  function ptXY(twa: number, spd: number) {
    const r   = toR(spd);
    const rad = (twa - 90) * Math.PI / 180;
    return {
      x: ox + r * Math.cos(rad),
      y: (oy + maxR) + r * Math.sin(rad),
    };
  }

  function buildPath(windIdx: number): string {
    const beatAngle = dims.polarBeatAngles?.[windIdx];
    const beatVmg   = dims.polarBeatVmg?.[windIdx];
    const gybeAngle = dims.polarGybeAngles?.[windIdx];
    const runVmg    = dims.polarRunVmg?.[windIdx];

    const pts: { twa: number; spd: number }[] = [];

    // Start at origin (speed=0 at beat angle) so curve starts from centre
    if (beatAngle != null && beatVmg != null)
      pts.push({ twa: beatAngle, spd: beatVmg });

    for (const row of rows!)
      if (row.speeds[windIdx] > 0)
        pts.push({ twa: row.twa, spd: row.speeds[windIdx] });

    // twa=180 at run VMG
    if (runVmg != null)
      pts.push({ twa: 180, spd: runVmg });

    pts.sort((a, b) => a.twa - b.twa);
    if (pts.length < 2) return "";

    // Build smooth path using cardinal spline through points
    return pts.map((p, i) => {
      const { x, y } = ptXY(p.twa, p.spd);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }

  const speedRings = [2, 4, 6, 8, 10, 12].filter(s => s <= maxSpeed + 0.5);
  const angleLines = [30, 60, 90, 120, 150];
  const originY    = oy + maxR;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: "100%", maxWidth: svgW, display: "block", margin: "0 auto" }}
      aria-label="Diagrama polar VPP">

      {/* ── Speed rings (semicircles) ── */}
      {speedRings.map(spd => {
        const r = toR(spd);
        return (
          <g key={spd}>
            {/* semicircle: from top (twa=0) clockwise to bottom (twa=180) */}
            <path
              d={`M ${ox} ${originY - r} A ${r} ${r} 0 0 1 ${ox} ${originY + r}`}
              fill="none" stroke="var(--border, #444)" strokeWidth={0.8} />
            {/* speed label to the left */}
            <text x={ox - 6} y={originY - r + 4} fontSize={10}
              fill="var(--text-soft, #888)" fontFamily="sans-serif" textAnchor="end">
              {spd} kt
            </text>
          </g>
        );
      })}

      {/* ── Axis lines ── */}
      {/* Vertical axis (0° and 180°) */}
      <line x1={ox} y1={oy} x2={ox} y2={oy + maxR * 2 + 20}
        stroke="var(--border, #555)" strokeWidth={0.8} />
      {/* Horizontal axis (90°) */}
      <line x1={ox} y1={originY} x2={ox + maxR + 10} y2={originY}
        stroke="var(--border, #555)" strokeWidth={0.8} />

      {/* ── Angle grid lines (30°, 60°, 120°, 150°) ── */}
      {angleLines.map(twa => {
        const rad = (twa - 90) * Math.PI / 180;
        const x2  = ox + maxR * Math.cos(rad);
        const y2  = originY + maxR * Math.sin(rad);
        const lx  = ox + (maxR + 20) * Math.cos(rad);
        const ly  = originY + (maxR + 20) * Math.sin(rad);
        return (
          <g key={twa}>
            <line x1={ox} y1={originY} x2={x2} y2={y2}
              stroke="var(--border, #444)" strokeWidth={0.8} />
            <text x={lx} y={ly + 4} fontSize={11} fill="var(--text-soft, #888)"
              fontFamily="sans-serif" textAnchor="middle">{twa}°</text>
          </g>
        );
      })}

      {/* ── 0° and 180° labels ── */}
      <text x={ox} y={oy - 6} fontSize={11} fill="var(--text-soft, #888)"
        fontFamily="sans-serif" textAnchor="middle">0°</text>
      <text x={ox} y={oy + maxR * 2 + 18} fontSize={11} fill="var(--text-soft, #888)"
        fontFamily="sans-serif" textAnchor="middle">180°</text>

      {/* ── SOW label ── */}
      <text x={ox - 48} y={originY - maxR * 0.5} fontSize={11}
        fill="var(--text-soft, #777)" fontFamily="sans-serif"
        textAnchor="middle" transform={`rotate(-90, ${ox - 48}, ${originY - maxR * 0.5})`}>
        SOW (kt)
      </text>

      {/* ── Polar curves ── */}
      {winds.map((wnd, i) => {
        const path = buildPath(i);
        if (!path) return null;
        return (
          <path key={wnd} d={path}
            fill="none"
            stroke={WIND_COLORS[i] ?? "#888"}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Legend (bottom-left, colour boxes) ── */}
      <text x={ox - 90} y={originY + 30} fontSize={10}
        fill="var(--text-soft, #888)" fontFamily="sans-serif">TWS</text>
      {winds.map((wnd, i) => (
        <g key={wnd} transform={`translate(${ox - 100}, ${originY + 46 + i * 20})`}>
          <rect width={32} height={14} rx={3}
            fill={WIND_COLORS[i] ?? "#888"} opacity={0.85} />
          <text x={38} y={11} fontSize={10} fill="var(--text-soft, #aaa)"
            fontFamily="sans-serif">{wnd} kt</text>
        </g>
      ))}
    </svg>
  );
}

export function PolarChart({ dims, boatName }: Props) {
  const [open, setOpen] = useState(false);
  const hasPolar = dims.polarRows && dims.polarRows.length > 0;
  if (!hasPolar) return null;

  return (
    <>
      <button className="btn-ghost" style={{ marginBottom: 12 }}
        type="button" onClick={() => setOpen(true)}>
        Ver polar
      </button>
      {open && (
        <Modal title={`Polar VPP${boatName ? ` — ${boatName}` : ""}`}
          onClose={() => setOpen(false)} wide>
          <PolarSvg dims={dims} />
        </Modal>
      )}
    </>
  );
}
