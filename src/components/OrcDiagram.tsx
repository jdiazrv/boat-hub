import type { BoatDimensions } from "../lib/types";

interface Props {
  dims: BoatDimensions;
}

export function OrcDiagram({ dims }: Props) {
  const P   = dims.P   ?? 18.7;
  const E   = dims.E   ?? 6.12;
  const J   = dims.J   ?? 5.45;
  const IG  = dims.IG  ?? 19.8;
  const ISP = dims.ISP ?? 19.8;
  const loa = dims.loa ?? 14.265;
  const bas = dims.BAS ?? 1.81;

  // SVG coordinate space: scale so P fills ~70% of height
  const svgH = 480;
  const svgW = 340;
  const scale = (svgH * 0.70) / P;

  // Reference points (SVG y increases downward)
  // Origin = deck-mast intersection
  const ox = svgW * 0.38;
  const oy = svgH * 0.78;  // waterline area

  // Mast head
  const mastHeadY = oy - P * scale;
  // Forestay at deck: x = bow tip
  const bowX = ox + J * scale;
  // Boom end
  const boomX = ox - E * scale;
  const boomY = oy - bas * scale;

  // Stemhead / bow at water
  const stemX = bowX;
  const stemY = oy + 1.2 * scale;

  // Transom
  const transomX = ox - loa * scale * 0.52;
  const transomY = oy;

  // Hull curve points (simplified)
  const hullKeel = ox + (J * 0.1) * scale;

  // Forestay
  const fsTopY = mastHeadY + (P - IG) * scale;

  // Spinnaker pole tip (ISP from masthead)
  const spkTopY = mastHeadY + (P - ISP) * scale;

  // Labels
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fill: "var(--text-soft)",
    fontFamily: "monospace",
  };
  const valueStyle: React.CSSProperties = {
    fontSize: 12,
    fill: "var(--accent)",
    fontFamily: "monospace",
    fontWeight: 600,
  };

  function dim(x1: number, y1: number, x2: number, y2: number, label: string, value: string, side: "left" | "right" = "right") {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = side === "right" ? 22 : -22;
    return (
      <g key={label}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeWidth={0.5} strokeDasharray="3 2" opacity={0.5} />
        <line x1={mx} y1={my} x2={mx + dx} y2={my} stroke="var(--accent)" strokeWidth={0.5} opacity={0.4} />
        <text x={mx + dx + (side === "right" ? 3 : -3)} y={my - 5} style={labelStyle} textAnchor={side === "right" ? "start" : "end"}>{label}</text>
        <text x={mx + dx + (side === "right" ? 3 : -3)} y={my + 7} style={valueStyle} textAnchor={side === "right" ? "start" : "end"}>{value}</text>
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }}
      aria-label="ORC rig diagram"
    >
      {/* ── Hull ── */}
      <path
        d={`M ${stemX} ${stemY}
            Q ${ox + J * scale * 0.5} ${oy + 2.8 * scale} ${hullKeel} ${oy + 3.2 * scale}
            Q ${ox - loa * scale * 0.25} ${oy + 2.5 * scale} ${transomX} ${transomY + 0.5 * scale}
            L ${transomX} ${transomY}
            L ${stemX} ${stemY} Z`}
        fill="var(--panel)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      {/* Deck line */}
      <line x1={stemX} y1={stemY - 0.3 * scale} x2={transomX} y2={transomY - 0.2 * scale}
        stroke="var(--border)" strokeWidth={1} />

      {/* ── Mast ── */}
      <line x1={ox} y1={oy} x2={ox} y2={mastHeadY}
        stroke="var(--text)" strokeWidth={2.5} strokeLinecap="round" />

      {/* ── Forestay ── */}
      <line x1={ox} y1={fsTopY} x2={bowX} y2={oy}
        stroke="var(--text)" strokeWidth={1} strokeLinecap="round" />

      {/* ── Spinnaker / ISP ── */}
      {ISP !== IG && (
        <line x1={ox} y1={spkTopY} x2={bowX} y2={oy}
          stroke="var(--text-soft)" strokeWidth={0.7} strokeDasharray="4 2" />
      )}

      {/* ── Mainsail (filled triangle) ── */}
      <polygon
        points={`${ox},${boomY} ${ox},${mastHeadY} ${boomX},${boomY}`}
        fill="var(--accent)"
        opacity={0.12}
        stroke="var(--accent)"
        strokeWidth={1}
      />

      {/* ── Headsail (filled triangle) ── */}
      <polygon
        points={`${bowX},${oy} ${ox},${fsTopY} ${ox},${oy}`}
        fill="var(--accent)"
        opacity={0.08}
        stroke="var(--accent)"
        strokeWidth={0.8}
      />

      {/* ── Boom ── */}
      <line x1={ox} y1={boomY} x2={boomX} y2={boomY}
        stroke="var(--text)" strokeWidth={1.8} strokeLinecap="round" />

      {/* ── Dimension annotations ── */}
      {dim(ox, mastHeadY, ox, boomY, "P", `${P} m`, "right")}
      {dim(ox, boomY, boomX, boomY, "E", `${E} m`, "left")}
      {dim(ox, fsTopY, bowX, oy, "J", `${J} m`, "right")}
      {dim(ox, mastHeadY, ox, fsTopY, "IG", `${IG} m`, "left")}

      {/* ── Waterline ── */}
      <line x1={transomX - 5} y1={oy + 0.5 * scale} x2={stemX + 5} y2={oy + 0.5 * scale}
        stroke="var(--accent)" strokeWidth={0.6} strokeDasharray="6 3" opacity={0.4} />

      {/* ── Labels: boat name ── */}
      <text x={svgW / 2} y={svgH - 10} style={{ ...labelStyle, fontSize: 10 }} textAnchor="middle">
        Esquema ORC — {dims.imsClass ?? "IMS"}
      </text>
    </svg>
  );
}
