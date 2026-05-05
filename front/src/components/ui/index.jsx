import { RefreshCw } from "lucide-react";
import { C, FONT_DISPLAY, FONT_MONO, FONT_BODY } from "../../styles/tokens";

// Badge 
export function Badge({ children, color = C.cyan }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: FONT_MONO,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 4,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {children}
    </span>
  );
}

// StatCard 
export function StatCard({ label, value, sub, accent = C.cyan }) {
  return (
    <div
      style={{
        background: C.bg3,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: C.text3,
          fontFamily: FONT_MONO,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.text,
          fontFamily: FONT_DISPLAY,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.text2 }}>{sub}</div>}
    </div>
  );
}

// Card 
export function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.bg2,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, right }) {
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.text,
            fontFamily: FONT_DISPLAY,
          }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ children, style = {} }) {
  return <div style={{ padding: "20px", ...style }}>{children}</div>;
}

// ProgressBar 
export function ProgressBar({ pct, color = C.cyan, height = 6 }) {
  return (
    <div
      style={{ height, background: C.bg4, borderRadius: 99, overflow: "hidden" }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 99,
          background: color,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

// PageHeader 
export function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: C.text,
          fontFamily: FONT_DISPLAY,
          letterSpacing: "-0.5px",
          margin: 0,
          marginBottom: 6,
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 12, color: C.text2, margin: 0, lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}

// LoadingSpinner 
export function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 200,
        gap: 8,
        color: C.text3,
        fontFamily: FONT_MONO,
        fontSize: 12,
      }}
    >
      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
      Loading...
    </div>
  );
}

// CustomTooltip (Recharts) 
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.bg4,
        border: `1px solid ${C.border2}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: FONT_MONO,
        fontSize: 11,
      }}
    >
      <div style={{ color: C.text2, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? C.cyan }}>
          {p.name}:{" "}
          <span style={{ color: C.text }}>
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// DisclaimerBanner
export function DisclaimerBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: `${C.amber}0a`,
        border: `1px solid ${C.amber}25`,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 28,
      }}
    >
      {/* inline SVG to avoid importing AlertTriangle here */}
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.amber}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p
        style={{
          fontSize: 11,
          color: C.amber,
          lineHeight: 1.6,
          margin: 0,
          fontFamily: FONT_BODY,
          opacity: 0.85,
        }}
      >
        <strong style={{ fontWeight: 600 }}>Data accuracy notice:</strong>{" "}
        Some insights are derived from GitHub Archive commit messages using keyword-based pattern analysis. Classification is heuristic and intended to provide directional signals rather than precise measurements.
      </p>
    </div>
  );
}
  export function IntentDisclaimerBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: `${C.amber}0a`,
        border: `1px solid ${C.amber}25`,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 28,
      }}
    >
      {/* inline SVG to avoid importing AlertTriangle here */}
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.amber}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p
        style={{
          fontSize: 11,
          color: C.amber,
          lineHeight: 1.6,
          margin: 0,
          fontFamily: FONT_BODY,
          opacity: 0.85,
        }}
      >
        <strong style={{ fontWeight: 600 }}>Data accuracy notice:</strong>{" "}
        Intent classification is based on heuristic keyword matching in commit messages. Results are approximate and should be interpreted as trends, not exact measurements.
      </p>
    </div>
  );
}