import { useState } from "react";
import { Modal } from "./Modal";
import type { BoatDimensions } from "../lib/types";

interface Props {
  dims: BoatDimensions;
  boatName?: string;
}

const WIND_COLORS = [
  "#4a9eda",
  "#5ab8f0",
  "#6dd4a0",
  "#a8d96d",
  "#f0c84a",
  "#f0904a",
  "#e05555",
];

function PolarSvg({ dims }: { dims: BoatDimensions }) {
  const rows  = dims.polarRows;
  const winds = dims.polarWindSpeeds ?? [6, 8, 10, 12, 14, 16, 20];

  if (!rows || rows.length === 0) return null;

  const cx = 240;
  const cy = 240;
  const svgW = 540;
  const svgH = 520;

  const maxSpeed = Math.max(...rows.flatMap(r => r.speeds.filter(s => s > 0)));
  const maxR = 190;
  const toR  = (spd: number) => (spd / maxSpeed) * maxR;

  // twa=0 → top (north), clockwise. Mirror left side for full circle.
  function pt(twa: number, spd: number) {
    const r   = toR(spd);
    const rad = (twa * Math.PI) / 180 - Math.PI / 2;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function buildPath(windIdx: number): string {
    const beatAngle = dims.polarBeatAngles?.[windIdx];
    const beatVmg   = dims.polarBeatVmg?.[windIdx];
    const gybeAngle = dims.polarGybeAngles?.[windIdx];
    const runVmg    = dims.polarRunVmg?.[windIdx];

    const pts: { twa: number; spd: number }[] = [];

    if (beatAngle != null && beatVmg != null)
      pts.push({ twa: beatAngle, spd: beatVmg });

    for (const row of rows!)
      if (row.speeds[windIdx] > 0)
        pts.push({ twa: row.twa, spd: row.speeds[windIdx] });

    if (gybeAngle != null && runVmg != null)
      pts.push({ twa: 180 - gybeAngle, spd: runVmg });

    pts.sort((a, b) => a.twa - b.twa);
    if (pts.length < 2) return "";

    // Build starboard side (0→180), then mirror to port (180→360)
    const stbd = pts.map((p, i) => {
      const { x, y } = pt(p.twa, p.spd);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Mirror: port side goes from 180 back to 0, x mirrored around cx
    const port = [...pts].reverse().map(p => {
      const { x, y } = pt(p.twa, p.spd);
      const mx = cx - (x - cx);  // mirror x
      return `L ${mx.toFixed(1)} ${y.toFixed(1)}`;
    });

    return [...stbd, ...port, "Z"].join(" ");
  }

  // Speed rings
  const speedRings = [2, 4, 6, 8, 10, 12].filter(s => s <= maxSpeed + 0.5);

  // Angle lines (full circle, every 30°)
  const angleLines = [0, 30, 60, 90, 120, 150, 180];

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: "100%", maxWidth: svgW, display: "block", margin: "0 auto" }}
      aria-label="Diagrama polar VPP">

      {/* ── Speed rings ── */}
      {speedRings.map(spd => {
        const r = toR(spd);
        return (
          <g key={spd}>
            <circle cx={cx} cy={cy} r={r}
              fill="none" stroke="var(--border, #333)" strokeWidth={0.7} opacity={0.5} />
            <text x={cx + 3} y={cy - r + 4} fontSize={9}
              fill="var(--text-soft, #666)" fontFamily="monospace">{spd} kn</text>
          </g>
        );
      })}

      {/* ── Angle grid lines ── */}
      {angleLines.map(twa => {
        const rad = twa * Math.PI / 180 - Math.PI / 2;
        const x2  = cx + maxR * Math.cos(rad);
        const y2  = cy + maxR * Math.sin(rad);
        // Mirror for port side
        const mx2 = cx - (x2 - cx);
        const lx  = cx + (maxR + 16) * Math.cos(rad);
        const ly  = cy + (maxR + 16) * Math.sin(rad);
        return (
          <g key={twa}>
            <line x1={cx} y1={cy} x2={x2} y2={y2}
              stroke="var(--border, #333)" strokeWidth={0.6} opacity={0.4} />
            {twa > 0 && twa < 180 && (
              <line x1={cx} y1={cy} x2={mx2} y2={y2}
                stroke="var(--border, #333)" strokeWidth={0.6} opacity={0.4} />
            )}
            <text x={lx} y={ly + 3} fontSize={9} fill="var(--text-soft, #777)"
              fontFamily="monospace" textAnchor="middle">{twa}°</text>
            {twa > 0 && twa < 180 && (
              <text x={cx-(lx-cx)} y={ly + 3} fontSize={9} fill="var(--text-soft, #777)"
                fontFamily="monospace" textAnchor="middle">{twa}°</text>
            )}
          </g>
        );
      })}

      {/* ── Centre cross ── */}
      <line x1={cx} y1={cy - maxR - 10} x2={cx} y2={cy + maxR + 10}
        stroke="var(--border, #444)" strokeWidth={0.6} opacity={0.4} />
      <circle cx={cx} cy={cy} r={2} fill="var(--text-soft, #666)" />

      {/* ── Polar curves ── */}
      {winds.map((wnd, i) => {
        const path = buildPath(i);
        if (!path) return null;
        return (
          <path key={wnd} d={path}
            fill={WIND_COLORS[i] ?? "#888"}
            fillOpacity={0.08}
            stroke={WIND_COLORS[i] ?? "#888"}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        );
      })}

      {/* ── Legend ── */}
      {winds.map((wnd, i) => (
        <g key={wnd} transform={`translate(${svgW - 68}, ${16 + i * 18})`}>
          <line x1={0} y1={6} x2={16} y2={6}
            stroke={WIND_COLORS[i] ?? "#888"} strokeWidth={2.5} />
          <text x={21} y={10} fontSize={10} fill="var(--text-soft, #aaa)"
            fontFamily="monospace">{wnd} kt</text>
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
        📈 Ver polar
      </button>
      {open && (
        <Modal title={`Polar VPP${boatName ? ` — ${boatName}` : ""}`} onClose={() => setOpen(false)} wide>
          <PolarSvg dims={dims} />
        </Modal>
      )}
    </>
  );
}
