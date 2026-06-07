import { useMemo, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Search, X, LayoutGrid, List } from "lucide-react";
import { useMcq } from "@/lib/mcq-store";
import { insertAtLastFocus } from "@/lib/last-focus";
import { useEquationActions } from "./Equation";
import type { EquationTemplate } from "@/lib/mcq-store";

type Category =
  | "All"
  | "Greek"
  | "Operators"
  | "Relations"
  | "Arrows"
  | "Sets"
  | "Logic"
  | "Calculus"
  | "Geometry"
  | "Scripts";

interface Sym {
  s: string; // symbol to insert
  name: string;
  cats: Category[];
}

// Pulled from MS Word's Equation tab symbol catalog.
const SYMBOLS: Sym[] = [
  // Greek lowercase
  ...["α:alpha","β:beta","γ:gamma","δ:delta","ε:epsilon","ζ:zeta","η:eta","θ:theta","ι:iota","κ:kappa","λ:lambda","μ:mu","ν:nu","ξ:xi","π:pi","ρ:rho","σ:sigma","τ:tau","υ:upsilon","φ:phi","χ:chi","ψ:psi","ω:omega"].map(p => { const [s,name]=p.split(":"); return { s, name, cats: ["Greek"] as Category[] }; }),
  // Greek uppercase
  ...["Γ:Gamma","Δ:Delta","Θ:Theta","Λ:Lambda","Ξ:Xi","Π:Pi","Σ:Sigma","Φ:Phi","Ψ:Psi","Ω:Omega"].map(p => { const [s,name]=p.split(":"); return { s, name, cats: ["Greek"] as Category[] }; }),

  // Operators
  { s: "±", name: "plus-minus", cats: ["Operators"] },
  { s: "∓", name: "minus-plus", cats: ["Operators"] },
  { s: "×", name: "times", cats: ["Operators"] },
  { s: "÷", name: "divide", cats: ["Operators"] },
  { s: "·", name: "dot", cats: ["Operators"] },
  { s: "∗", name: "asterisk", cats: ["Operators"] },
  { s: "∘", name: "ring", cats: ["Operators"] },
  { s: "√", name: "sqrt", cats: ["Operators", "Calculus"] },
  { s: "∛", name: "cube root", cats: ["Operators"] },
  { s: "∜", name: "fourth root", cats: ["Operators"] },
  { s: "%", name: "percent", cats: ["Operators"] },
  { s: "‰", name: "per mille", cats: ["Operators"] },
  { s: "°", name: "degree", cats: ["Geometry","Operators"] },
  { s: "′", name: "prime", cats: ["Operators"] },
  { s: "″", name: "double prime", cats: ["Operators"] },

  // Relations
  { s: "=", name: "equals", cats: ["Relations"] },
  { s: "≠", name: "not equal", cats: ["Relations"] },
  { s: "≈", name: "approx", cats: ["Relations"] },
  { s: "≅", name: "congruent", cats: ["Relations","Geometry"] },
  { s: "≡", name: "identical", cats: ["Relations"] },
  { s: "∝", name: "proportional", cats: ["Relations"] },
  { s: "≤", name: "less or equal", cats: ["Relations"] },
  { s: "≥", name: "greater or equal", cats: ["Relations"] },
  { s: "≪", name: "much less", cats: ["Relations"] },
  { s: "≫", name: "much greater", cats: ["Relations"] },
  { s: "<", name: "less", cats: ["Relations"] },
  { s: ">", name: "greater", cats: ["Relations"] },
  { s: "∼", name: "similar", cats: ["Relations","Geometry"] },

  // Arrows
  { s: "→", name: "right arrow", cats: ["Arrows"] },
  { s: "←", name: "left arrow", cats: ["Arrows"] },
  { s: "↑", name: "up arrow", cats: ["Arrows"] },
  { s: "↓", name: "down arrow", cats: ["Arrows"] },
  { s: "↔", name: "left-right arrow", cats: ["Arrows"] },
  { s: "⇒", name: "implies", cats: ["Arrows","Logic"] },
  { s: "⇐", name: "implied by", cats: ["Arrows","Logic"] },
  { s: "⇔", name: "iff", cats: ["Arrows","Logic"] },
  { s: "⇌", name: "equilibrium", cats: ["Arrows"] },
  { s: "↦", name: "maps to", cats: ["Arrows"] },

  // Sets
  { s: "∈", name: "element of", cats: ["Sets"] },
  { s: "∉", name: "not element of", cats: ["Sets"] },
  { s: "∋", name: "contains", cats: ["Sets"] },
  { s: "⊂", name: "subset", cats: ["Sets"] },
  { s: "⊆", name: "subset or equal", cats: ["Sets"] },
  { s: "⊄", name: "not subset", cats: ["Sets"] },
  { s: "⊃", name: "superset", cats: ["Sets"] },
  { s: "⊇", name: "superset or equal", cats: ["Sets"] },
  { s: "∪", name: "union", cats: ["Sets"] },
  { s: "∩", name: "intersection", cats: ["Sets"] },
  { s: "∅", name: "empty set", cats: ["Sets"] },
  { s: "ℕ", name: "natural numbers", cats: ["Sets"] },
  { s: "ℤ", name: "integers", cats: ["Sets"] },
  { s: "ℚ", name: "rationals", cats: ["Sets"] },
  { s: "ℝ", name: "reals", cats: ["Sets"] },
  { s: "ℂ", name: "complex", cats: ["Sets"] },

  // Logic
  { s: "∀", name: "for all", cats: ["Logic"] },
  { s: "∃", name: "there exists", cats: ["Logic"] },
  { s: "∄", name: "no exists", cats: ["Logic"] },
  { s: "¬", name: "not", cats: ["Logic"] },
  { s: "∧", name: "and", cats: ["Logic"] },
  { s: "∨", name: "or", cats: ["Logic"] },
  { s: "⊕", name: "xor", cats: ["Logic"] },
  { s: "∴", name: "therefore", cats: ["Logic"] },
  { s: "∵", name: "because", cats: ["Logic"] },

  // Calculus
  { s: "∞", name: "infinity", cats: ["Calculus"] },
  { s: "∑", name: "sum", cats: ["Calculus"] },
  { s: "∏", name: "product", cats: ["Calculus"] },
  { s: "∫", name: "integral", cats: ["Calculus"] },
  { s: "∬", name: "double integral", cats: ["Calculus"] },
  { s: "∭", name: "triple integral", cats: ["Calculus"] },
  { s: "∮", name: "contour integral", cats: ["Calculus"] },
  { s: "∂", name: "partial", cats: ["Calculus"] },
  { s: "∇", name: "nabla", cats: ["Calculus"] },
  { s: "Δ", name: "delta", cats: ["Calculus","Greek"] },
  { s: "lim", name: "limit", cats: ["Calculus"] },

  // Geometry
  { s: "∠", name: "angle", cats: ["Geometry"] },
  { s: "∡", name: "measured angle", cats: ["Geometry"] },
  { s: "⊥", name: "perpendicular", cats: ["Geometry"] },
  { s: "∥", name: "parallel", cats: ["Geometry"] },
  { s: "△", name: "triangle", cats: ["Geometry"] },
  { s: "□", name: "square", cats: ["Geometry"] },
  { s: "○", name: "circle", cats: ["Geometry"] },
  { s: "⌒", name: "arc", cats: ["Geometry"] },
  { s: "π", name: "pi", cats: ["Geometry","Greek"] },

  // Scripts (super/subscripts)
  ...["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹","⁺","⁻","ⁿ","ⁱ"].map(s => ({ s, name: `superscript ${s}`, cats: ["Scripts"] as Category[] })),
  ...["₀","₁","₂","₃","₄","₅","₆","₇","₈","₉","₊","₋","ₙ","ᵢ","ₓ"].map(s => ({ s, name: `subscript ${s}`, cats: ["Scripts"] as Category[] })),
];

const CATEGORIES: Category[] = ["All","Greek","Operators","Relations","Arrows","Sets","Logic","Calculus","Geometry","Scripts"];

export function EquationsPicker() {
  const { equationsPickerOpen, setEquationsPickerOpen } = useMcq();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Category>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const insertEquation = useEquationActions();

  const TEMPLATES: { id: EquationTemplate; label: string; preview: string }[] = [
    { id: "fraction", label: "Fraction", preview: "a⁄b" },
    { id: "sqrt", label: "Sqrt", preview: "√x" },
    { id: "nthroot", label: "n-root", preview: "ⁿ√x" },
    { id: "power", label: "Power", preview: "xⁿ" },
    { id: "derivative", label: "Derivative", preview: "d/dx" },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYMBOLS.filter((sym) => {
      if (tab !== "All" && !sym.cats.includes(tab)) return false;
      if (!q) return true;
      return sym.name.toLowerCase().includes(q) || sym.s.includes(q);
    });
  }, [query, tab]);

  const insert = (sym: string) => {
    insertAtLastFocus(sym);
  };

  // Prevent the panel from stealing focus from the active text field.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) setEquationsPickerOpen(false);
  };

  return (
    <AnimatePresence>
      {equationsPickerOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={keepFocus}
            onClick={() => setEquationsPickerOpen(false)}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 canvas-paper rounded-t-3xl shadow-pop pb-[env(safe-area-inset-bottom)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onMouseDown={keepFocus}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-canvas-foreground/20" />

            <div className="px-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold text-base text-canvas-foreground">Equations</h3>
                <p className="text-[11px] text-canvas-foreground/60">Common math & special symbols</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex bg-canvas-foreground/5 rounded-full p-0.5 border border-canvas-foreground/10">
                  <button
                    onMouseDown={keepFocus}
                    onClick={() => setView("grid")}
                    className={`size-7 rounded-full grid place-items-center transition ${view === "grid" ? "bg-canvas-foreground text-canvas" : "text-canvas-foreground/60"}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                  <button
                    onMouseDown={keepFocus}
                    onClick={() => setView("list")}
                    className={`size-7 rounded-full grid place-items-center transition ${view === "list" ? "bg-canvas-foreground text-canvas" : "text-canvas-foreground/60"}`}
                    aria-label="List view"
                  >
                    <List className="size-3.5" />
                  </button>
                </div>
                <button
                  onMouseDown={keepFocus}
                  onClick={() => setEquationsPickerOpen(false)}
                  className="size-9 rounded-full border border-canvas-foreground/15 grid place-items-center text-canvas-foreground/70"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="px-4 mt-3">
              <div className="flex items-center gap-2 bg-canvas-foreground/5 rounded-full pl-4 pr-3 py-2.5 border border-canvas-foreground/10">
                <Search className="size-4 text-canvas-foreground/60" />
                <input
                  data-no-insert
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search equations or symbols"
                  className="flex-1 bg-transparent text-sm text-canvas-foreground outline-none placeholder:text-canvas-foreground/40"
                />
              </div>
            </div>

            <div className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onMouseDown={keepFocus}
                  onClick={() => setTab(c)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    tab === c
                      ? "bg-canvas-foreground text-canvas"
                      : "bg-canvas-foreground/5 text-canvas-foreground/80"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="px-4 mt-3 pb-5 max-h-[48vh] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-canvas-foreground/50 mb-2 font-semibold">
                Templates
              </p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={keepFocus}
                    onClick={() => {
                      insertEquation(t.id);
                      setEquationsPickerOpen(false);
                    }}
                    title={t.label}
                    className="h-14 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-canvas-foreground transition"
                  >
                    <span className="font-serif italic text-base">{t.preview}</span>
                    <span className="text-[9px] uppercase tracking-wider text-canvas-foreground/60">{t.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-canvas-foreground/50 mb-2 font-semibold">
                {tab} · {filtered.length}
              </p>
              {view === "grid" ? (
                <div className="grid grid-cols-8 gap-1.5">
                  {filtered.map((sym, i) => (
                    <button
                      key={`${sym.s}-${i}`}
                      onMouseDown={keepFocus}
                      onClick={() => insert(sym.s)}
                      title={sym.name}
                      className="aspect-square rounded-lg bg-canvas-foreground/5 hover:bg-canvas-foreground/15 active:bg-canvas-foreground/20 text-canvas-foreground text-base font-serif transition"
                    >
                      {sym.s}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="col-span-8 text-center text-xs text-canvas-foreground/50 py-6">
                      No symbols found.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-canvas-foreground/10">
                  {filtered.map((sym, i) => (
                    <button
                      key={`${sym.s}-${i}`}
                      onMouseDown={keepFocus}
                      onClick={() => insert(sym.s)}
                      className="w-full flex items-center gap-3 py-2 px-1 hover:bg-canvas-foreground/5 rounded-md text-left"
                    >
                      <span className="size-8 grid place-items-center rounded-md bg-canvas-foreground/5 text-canvas-foreground text-base font-serif shrink-0">
                        {sym.s}
                      </span>
                      <span className="text-xs text-canvas-foreground/80 capitalize">{sym.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



