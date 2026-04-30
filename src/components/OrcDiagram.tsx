import type { BoatDimensions } from "../lib/types";

interface Props {
  dims: BoatDimensions;
  boatName?: string;
  sailNumber?: string;
}

// ── Vertical dimension cota ───────────────────────────────────────────────────
function VDim({
  anchorX, y1, y2, rulerX, label, value,
}: {
  anchorX: number; y1: number; y2: number; rulerX: number;
  label: string; value: string;
}) {
  const right = rulerX >= anchorX;
  const ta  = right ? "start" : "end";
  const tx  = right ? rulerX + 5 : rulerX - 5;
  const mid = (y1 + y2) / 2;
  const arr = 5;
  const arrDown = `${rulerX - arr / 2},${y1 + 1} ${rulerX + arr / 2},${y1 + 1} ${rulerX},${y1 + arr + 1}`;
  const arrUp   = `${rulerX - arr / 2},${y2 - 1} ${rulerX + arr / 2},${y2 - 1} ${rulerX},${y2 - arr - 1}`;
  return (
    <g>
      <line x1={anchorX} y1={y1} x2={rulerX + (right ? 3 : -3)} y2={y1} stroke="var(--border, #555)" strokeWidth={0.7} />
      <line x1={anchorX} y1={y2} x2={rulerX + (right ? 3 : -3)} y2={y2} stroke="var(--border, #555)" strokeWidth={0.7} />
      <line x1={rulerX} y1={y1} x2={rulerX} y2={y2} stroke="var(--text-soft, #888)" strokeWidth={0.8} />
      <polygon points={arrDown} fill="var(--text-soft, #888)" />
      <polygon points={arrUp}   fill="var(--text-soft, #888)" />
      <text x={tx} y={mid - 3}  fontSize={9}   fill="var(--text-soft, #888)" fontFamily="monospace" textAnchor={ta} fontStyle="italic">{label}</text>
      <text x={tx} y={mid + 9}  fontSize={9.5} fill="var(--text, #eee)"      fontFamily="monospace" textAnchor={ta} fontWeight="700">{value}</text>
    </g>
  );
}

// ── Horizontal dimension cota ─────────────────────────────────────────────────
function HDim({
  x1, x2, anchorY, rulerY, label, value,
}: {
  x1: number; x2: number; anchorY: number; rulerY: number;
  label: string; value: string;
}) {
  const below = rulerY >= anchorY;
  const ty  = below ? rulerY + 10 : rulerY - 4;
  const mid = (x1 + x2) / 2;
  const arr = 5;
  const arrRight = `${x1 + 1},${rulerY - arr / 2} ${x1 + 1},${rulerY + arr / 2} ${x1 + arr + 1},${rulerY}`;
  const arrLeft  = `${x2 - 1},${rulerY - arr / 2} ${x2 - 1},${rulerY + arr / 2} ${x2 - arr - 1},${rulerY}`;
  return (
    <g>
      <line x1={x1} y1={anchorY} x2={x1} y2={rulerY + (below ? 3 : -3)} stroke="var(--border, #555)" strokeWidth={0.7} />
      <line x1={x2} y1={anchorY} x2={x2} y2={rulerY + (below ? 3 : -3)} stroke="var(--border, #555)" strokeWidth={0.7} />
      <line x1={x1} y1={rulerY} x2={x2} y2={rulerY} stroke="var(--text-soft, #888)" strokeWidth={0.8} />
      <polygon points={arrRight} fill="var(--text-soft, #888)" />
      <polygon points={arrLeft}  fill="var(--text-soft, #888)" />
      <text x={mid} y={ty}      fontSize={9}   fill="var(--text-soft, #888)" fontFamily="monospace" textAnchor="middle" fontStyle="italic">{label}</text>
      <text x={mid} y={ty + 11} fontSize={9.5} fill="var(--text, #eee)"      fontFamily="monospace" textAnchor="middle" fontWeight="700">{value}</text>
    </g>
  );
}

function fmt(v: number | null | undefined, d = 3): string {
  if (v == null) return "—";
  return v.toFixed(d);
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrcDiagram({ dims, boatName, sailNumber }: Props) {
  // Measurements with sensible fallbacks
  const P   = dims.P   ?? 18.7;
  const E   = dims.E   ?? P * 0.34;
  const J   = dims.J   ?? P * 0.30;
  const IG  = dims.IG  ?? P * 1.04;
  const ISP = dims.ISP ?? IG;
  const BAS = dims.BAS ?? P * 0.09;
  const TPS = dims.TPS ?? null;
  const loa = dims.loa ?? J + P * 0.47;

  // ── Canvas ──────────────────────────────────────────────────────────────────
  const marginL = 20;
  const marginR = 100;
  const marginT = 30;
  const marginB = 90;
  const drawW   = 340;
  const drawH   = 400;

  const svgW = marginL + drawW + marginR;
  const svgH = marginT + drawH + marginB;

  // Scale: P fills 82% of drawH — visual only, not real-world scale
  const scale = (drawH * 0.82) / P;

  // ── Layout: BOW=LEFT, STERN=RIGHT (standard ORC convention) ─────────────────
  // Mast at fixed 45% from left — gives room for bow (J) on left and stern on right
  const mastX = marginL + drawW * 0.45;
  const deckY = marginT + drawH * 0.88;

  // ── Key rig points ───────────────────────────────────────────────────────────
  const mastHeadY = deckY - P   * scale;
  const bowX      = mastX + J   * scale;   // bow = RIGHT
  const boomEndX  = mastX - E   * scale;   // boom = LEFT (toward stern)
  const boomY     = deckY - BAS * scale;
  // IG/ISP capped at 95% of P visually so génova/spi always start below masthead
  const fsTopY    = deckY - Math.min(IG,  P * 0.95) * scale;
  const spkTopY   = deckY - Math.min(ISP, P * 0.97) * scale;

  // ── Hull geometry: simple ORC trapezoid ──────────────────────────────────────
  // Bow (RIGHT): raked forward — deck overhangs keel (proa lanzada hacia el agua)
  const overhang       = drawW * 0.04;
  const hullBowDeckX   = bowX + overhang;       // deck más a la derecha
  const hullBowKeelX   = bowX;                  // keel más adentro
  // Stern (LEFT): counter stern — keel overhangs deck (popa lanzada hacia cubierta)
  const sternX         = mastX - (loa - J) * scale * 0.62;
  const hullSternDeckX = sternX + overhang * 0.4;  // deck más adentro
  const hullSternKeelX = sternX;                    // keel más a la izquierda
  // Hull depth: fixed visual proportion (not real draft)
  const hullDepth  = drawH * 0.07;
  const keelBotY   = deckY + hullDepth;
  const wlY        = deckY + hullDepth * 0.55;

  // ── Cota ruler positions ─────────────────────────────────────────────────────
  // Vertical: stacked to the RIGHT of the bow (outside the hull, clear of sails)
  const rulerBAS = hullBowDeckX + 16;
  const rulerIG  = hullBowDeckX + 40;
  const rulerP   = hullBowDeckX + 64;
  const rulerISP = hullBowDeckX + 88;

  // Horizontal: stacked below deck
  const rulerE   = boomY - 20;
  const rulerJ   = deckY + 24;
  const rulerTPS = deckY + 48;
  const rulerLOA = keelBotY + 26;

  // Spreader
  const sprdY = mastHeadY + P * scale * 0.44;
  const sprdW = J * scale * 0.28;

  // Sail areas
  const ms  = dims.mainsailMeasured;
  const hs  = dims.headsailMeasured;
  const asy = dims.asymmetricMeasured;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: "100%", maxWidth: svgW, display: "block", margin: "0 auto" }}
      aria-label="Diagrama aparejo ORC"
    >
      {/* ── Waterline ── */}
      <line x1={hullSternDeckX - 6} y1={wlY} x2={hullBowDeckX + 8} y2={wlY}
        stroke="#4a90d9" strokeWidth={2} strokeDasharray="8 3" opacity={0.7} />

      {/* ── Hull: bow=right (raked), stern=left (vertical transom) ── */}
      <polygon
        points={`${hullSternDeckX},${deckY} ${hullSternKeelX},${keelBotY} ${hullBowKeelX},${keelBotY} ${hullBowDeckX},${deckY}`}
        fill="none" stroke="var(--text, #ccc)" strokeWidth={1.5} />

      {/* ── Headsail: proa (derecha) → mástil arriba → pie mástil ── */}
      <polygon
        points={`${bowX},${deckY} ${mastX},${fsTopY} ${mastX},${deckY}`}
        fill="rgba(100,150,220,0.18)" stroke="rgba(100,160,240,0.7)" strokeWidth={1} />

      {/* ── Spinnaker (dashed, lado proa/derecha — mismo que génova) ── */}
      <path d={`M ${mastX} ${spkTopY}
          Q ${bowX + J * scale * 0.5} ${spkTopY + (deckY - spkTopY) * 0.3}
            ${bowX + J * scale * 0.3} ${deckY}
          L ${bowX} ${deckY} Z`}
        fill="none" stroke="rgba(160,180,220,0.4)" strokeWidth={0.9} strokeDasharray="5 3" />

      {/* ── Mast ── */}
      <line x1={mastX} y1={deckY} x2={mastX} y2={mastHeadY}
        stroke="rgba(180,180,180,0.35)" strokeWidth={9} strokeLinecap="round" />
      <line x1={mastX} y1={deckY} x2={mastX} y2={mastHeadY}
        stroke="var(--text, #ccc)" strokeWidth={3.5} strokeLinecap="round" />

      {/* ── Mainsail (boom to port/left, same side as bow) ── */}
      <polygon
        points={`${mastX},${mastHeadY} ${mastX},${boomY} ${boomEndX},${boomY}`}
        fill="rgba(100,150,220,0.22)" stroke="rgba(120,170,240,0.75)" strokeWidth={1.2} />

      {/* ── Boom ── */}
      <line x1={mastX} y1={boomY} x2={boomEndX} y2={boomY}
        stroke="var(--text, #ccc)" strokeWidth={3.5} strokeLinecap="round" />

      {/* ── Forestay (mástil → proa derecha) ── */}
      <line x1={mastX} y1={fsTopY} x2={bowX} y2={deckY}
        stroke="var(--text, #ccc)" strokeWidth={1.3} />

      {/* ── Backstay (mástil → popa izquierda) ── */}
      <line x1={mastX} y1={mastHeadY} x2={hullSternDeckX} y2={deckY}
        stroke="var(--text-soft, #888)" strokeWidth={0.8} strokeDasharray="4 2" />

      {/* ── Spreader (hacia proa/derecha) ── */}
      <line x1={mastX} y1={sprdY} x2={mastX + sprdW} y2={sprdY + sprdW * 0.08}
        stroke="var(--text, #ccc)" strokeWidth={2} strokeLinecap="round" />

      {/* ── Masthead cap ── */}
      <rect x={mastX - 4} y={mastHeadY - 4} width={9} height={5}
        fill="var(--text, #ccc)" rx={1} />

      {/* ── Forestay attachment (IG mark) ── */}
      <circle cx={mastX} cy={fsTopY} r={3}
        fill="var(--accent, #5a9)" stroke="var(--panel, #111)" strokeWidth={1} />

      {/* ── Spinnaker halyard (ISP mark) ── */}
      {Math.abs(ISP - IG) > 0.05 && (
        <circle cx={mastX} cy={spkTopY} r={2.5}
          fill="rgba(160,120,220,0.85)" stroke="var(--panel, #111)" strokeWidth={1} />
      )}

      {/* ── Boat name inside mainsail ── */}
      {(() => {
        const cx = mastX - E * scale * 0.38;  // boom side (izquierda/popa)
        const cy = mastHeadY + (boomY - mastHeadY) * 0.47;
        const name = boatName ?? dims.imsClass ?? null;
        return (
          <>
            {name && (
              <text x={cx} y={cy} fontSize={13} fill="rgba(120,170,240,0.85)"
                fontFamily="sans-serif" fontWeight="800" textAnchor="middle">{name}</text>
            )}
            {sailNumber && (
              <text x={cx} y={cy + 17} fontSize={11} fill="rgba(120,170,240,0.65)"
                fontFamily="sans-serif" fontWeight="600" textAnchor="middle">{sailNumber}</text>
            )}
          </>
        );
      })()}

      {/* ── Sail areas (top-left) ── */}
      {(ms != null || hs != null || asy != null) && (
        <g fontFamily="monospace" fontSize={9}>
          {ms  != null && <text x={marginL} y={marginT - 4}      fill="var(--text-soft, #aaa)"><tspan fontStyle="italic">Mainsail   </tspan><tspan fill="var(--text, #eee)" fontWeight="700">= {ms.toFixed(2)} m²</tspan></text>}
          {hs  != null && <text x={marginL} y={marginT - 4 + 13} fill="var(--text-soft, #aaa)"><tspan fontStyle="italic">Headsail   </tspan><tspan fill="var(--text, #eee)" fontWeight="700">= {hs.toFixed(2)} m²</tspan></text>}
          {asy != null && <text x={marginL} y={marginT - 4 + 26} fill="var(--text-soft, #aaa)"><tspan fontStyle="italic">Asymmetric </tspan><tspan fill="var(--text, #eee)" fontWeight="700">= {asy.toFixed(2)} m²</tspan></text>}
        </g>
      )}

      {/* ══════════ COTAS ══════════ */}

      {/* BAS: boom height above deck */}
      <VDim anchorX={mastX} y1={boomY} y2={deckY}
        rulerX={rulerBAS} label="BAS" value={`${fmt(BAS)} m`} />

      {/* P: mainsail hoist */}
      <VDim anchorX={mastX} y1={mastHeadY} y2={boomY}
        rulerX={rulerP} label="P" value={`${fmt(P)} m`} />

      {/* IG: forestay height */}
      <VDim anchorX={mastX} y1={fsTopY} y2={deckY}
        rulerX={rulerIG} label="IG" value={`${fmt(IG)} m`} />

      {/* ISP: spinnaker halyard height */}
      {Math.abs(ISP - IG) > 0.05 && (
        <VDim anchorX={mastX} y1={spkTopY} y2={deckY}
          rulerX={rulerISP} label="ISP" value={`${fmt(ISP)} m`} />
      )}

      {/* E: boom length (hacia popa/izquierda) */}
      <HDim x1={boomEndX} x2={mastX} anchorY={boomY} rulerY={rulerE}
        label="E" value={`${fmt(E)} m`} />

      {/* J: foretriangle base (hacia proa/derecha) */}
      <HDim x1={mastX} x2={bowX} anchorY={deckY} rulerY={rulerJ}
        label="J" value={`${fmt(J)} m`} />

      {/* TPS (hacia proa/derecha) */}
      {TPS != null && (
        <HDim x1={mastX} x2={mastX + TPS * scale} anchorY={deckY} rulerY={rulerTPS}
          label="TPS" value={`${fmt(TPS)} m`} />
      )}

      {/* LOA */}
      <HDim x1={hullSternKeelX} x2={hullBowKeelX} anchorY={keelBotY} rulerY={rulerLOA}
        label="LOA" value={`${fmt(loa)} m`} />

      {/* ── Footer ── */}
      <text x={svgW / 2} y={svgH - 5}
        fontSize={8} fill="var(--text-soft, #666)" fontFamily="monospace" textAnchor="middle">
        ORC {dims.certNo ? `· ${dims.certNo}` : dims.imsClass ? `· ${dims.imsClass}` : ""}
      </text>
    </svg>
  );
}
