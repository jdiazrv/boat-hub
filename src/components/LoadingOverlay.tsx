import "./LoadingOverlay.css";

export function LoadingOverlay({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? "loading-overlay loading-overlay--full" : "loading-overlay loading-overlay--inline"}>
      <div className="loading-anchor">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Anchor ring */}
          <circle cx="24" cy="14" r="5" stroke="var(--accent)" strokeWidth="2.5" fill="none" className="anchor-ring" />
          {/* Anchor vertical shaft */}
          <line x1="24" y1="19" x2="24" y2="38" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" className="anchor-shaft" />
          {/* Anchor crossbar */}
          <line x1="14" y1="22" x2="34" y2="22" stroke="var(--accent-warm)" strokeWidth="2.5" strokeLinecap="round" className="anchor-bar" />
          {/* Anchor left arm */}
          <path d="M24 38 Q16 38 14 32" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" fill="none" className="anchor-left" />
          {/* Anchor right arm */}
          <path d="M24 38 Q32 38 34 32" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" fill="none" className="anchor-right" />
          {/* Left tip */}
          <circle cx="14" cy="32" r="2" fill="var(--accent-warm)" className="anchor-tip-l" />
          {/* Right tip */}
          <circle cx="34" cy="32" r="2" fill="var(--accent-warm)" className="anchor-tip-r" />
        </svg>
        {/* Wave dots */}
        <div className="loading-wave">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
