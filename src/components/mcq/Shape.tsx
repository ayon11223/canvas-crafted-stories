import type { ShapeKind } from "@/lib/mcq-store";

interface Props {
  kind: ShapeKind;
  label?: string;
  className?: string;
}

const stroke = "oklch(0.42 0.16 265)";
const accent = "oklch(0.62 0.20 25)";

export function Shape({ kind, label, className }: Props) {
  const common = { fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid meet">
      {kind === "triangle" && (
        <polygon points="50,12 90,88 10,88" {...common} />
      )}
      {kind === "right-triangle" && (
        <>
          <polygon points="14,14 86,86 14,86" {...common} />
          <path d="M14 76 L24 76 L24 86" stroke={stroke} fill="none" strokeWidth={1.5} />
          <line x1="10" y1="48" x2="18" y2="48" stroke={accent} strokeWidth={2} />
          <line x1="10" y1="52" x2="18" y2="52" stroke={accent} strokeWidth={2} />
          <line x1="46" y1="46" x2="54" y2="54" stroke={accent} strokeWidth={2} />
        </>
      )}
      {kind === "square" && <rect x="14" y="14" width="72" height="72" {...common} />}
      {kind === "rectangle" && <rect x="10" y="26" width="80" height="48" {...common} />}
      {kind === "circle" && (
        <>
          <circle cx="50" cy="50" r="36" {...common} />
          <line x1="50" y1="50" x2="86" y2="50" stroke={stroke} strokeWidth={1.5} strokeDasharray="2 3" />
        </>
      )}
      {kind === "venn" && (
        <>
          <circle cx="36" cy="50" r="26" fill="oklch(0.85 0.12 0 / 0.5)" stroke={stroke} strokeWidth={1.5} />
          <circle cx="64" cy="50" r="26" fill="none" stroke={stroke} strokeWidth={1.5} />
          <text x="22" y="22" fontSize="9" fill={stroke}>A</text>
          <text x="72" y="22" fontSize="9" fill={stroke}>B</text>
        </>
      )}
      {kind === "arc" && <path d="M14 86 A 70 70 0 0 1 86 14" {...common} />}
      {kind === "cube" && (
        <>
          <rect x="14" y="28" width="56" height="56" {...common} />
          <polygon points="14,28 30,12 86,12 70,28" {...common} />
          <polygon points="70,28 86,12 86,68 70,84" {...common} />
          <line x1="14" y1="84" x2="30" y2="68" {...common} strokeDasharray="2 3" />
          <line x1="30" y1="68" x2="86" y2="68" {...common} strokeDasharray="2 3" />
          <line x1="30" y1="68" x2="30" y2="12" {...common} strokeDasharray="2 3" />
        </>
      )}
      {kind === "pyramid" && (
        <>
          <polygon points="50,10 86,76 14,76" {...common} />
          <path d="M14 76 Q 50 88 86 76" {...common} />
          <line x1="50" y1="10" x2="50" y2="82" {...common} strokeDasharray="2 3" />
        </>
      )}
      {kind === "cylinder" && (
        <>
          <ellipse cx="50" cy="20" rx="32" ry="8" {...common} />
          <path d="M18 20 L18 78" {...common} />
          <path d="M82 20 L82 78" {...common} />
          <path d="M18 78 A 32 8 0 0 0 82 78" {...common} />
          <path d="M18 78 A 32 8 0 0 1 82 78" {...common} strokeDasharray="2 3" />
        </>
      )}
      {kind === "axis" && (
        <>
          <line x1="10" y1="50" x2="90" y2="50" {...common} />
          <line x1="50" y1="10" x2="50" y2="90" {...common} />
          <polygon points="90,50 84,47 84,53" fill={stroke} />
          <polygon points="50,10 47,16 53,16" fill={stroke} />
          <line x1="20" y1="78" x2="80" y2="22" stroke="oklch(0.55 0.20 295)" strokeWidth={2} />
          <text x="62" y="46" fontSize="7" fill={stroke}>(2,-1)</text>
        </>
      )}
      {kind === "line" && <line x1="12" y1="80" x2="88" y2="20" {...common} />}
      {kind === "equation" && (
        <text x="50" y="58" textAnchor="middle" fontSize="22" fill={stroke} fontFamily="serif" fontStyle="italic">
          {label ?? "∫f(x)dx"}
        </text>
      )}
    </svg>
  );
}



