import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Search, Mic, X } from "lucide-react";
import { useMcq, type ShapeKind } from "@/lib/mcq-store";
import { Shape } from "./Shape";

const CATEGORIES = ["Trigonometry", "Axis and Plane", "Circle", "Set & Function"] as const;

const RECENT: { kind: ShapeKind; label?: string }[] = [
  { kind: "right-triangle" },
  { kind: "equilateral-triangle" },
  { kind: "isosceles-triangle" },
  { kind: "scalene-triangle" },
  { kind: "rhombus" },
  { kind: "venn" },
  { kind: "arc" },
  { kind: "cube" },
  { kind: "axis" },
  { kind: "pyramid" },
  { kind: "circle" },
  { kind: "cylinder" },
];

const EQUATIONS = [
  "∫f(x)dx",
  "lim x→0",
  "log₂ x",
  "Σ aₙ",
  "√x",
  "x²+y²",
];

export function ShapePicker() {
  const { shapePickerOpen, setShapePicker, addItem } = useMcq();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("Recent");

  const close = () => setShapePicker(false);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) close();
  };

  return (
    <AnimatePresence>
      {shapePickerOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 canvas-paper rounded-t-3xl shadow-pop pb-[env(safe-area-inset-bottom)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="mx-auto mt-2 mb-3 h-1.5 w-12 rounded-full bg-canvas-foreground/20" />
            <div className="px-4 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-canvas-foreground/5 rounded-full pl-4 pr-3 py-2.5 border border-canvas-foreground/10">
                <Search className="size-4 text-canvas-foreground/60" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search shapes, equations..."
                  className="flex-1 bg-transparent text-sm text-canvas-foreground outline-none placeholder:text-canvas-foreground/40"
                />
                <Mic className="size-4 text-canvas-foreground/60" />
              </div>
              <button
                onClick={() => setShapePicker(false)}
                className="size-10 rounded-full border border-canvas-foreground/15 grid place-items-center text-canvas-foreground/70"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-4 mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {["Recent", ...CATEGORIES].map((c) => (
                <button
                  key={c}
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

            <div className="px-4 mt-4 pb-6 max-h-[55vh] overflow-y-auto">
              <p className="text-center text-xs text-canvas-foreground/50 mb-3">{tab}</p>
              <div className="grid grid-cols-4 gap-3">
                {RECENT.map((it, i) => (
                  <button
                    key={i}
                    onClick={() => addItem(it.kind, it.label)}
                    className="aspect-square rounded-xl bg-canvas-foreground/5 hover:bg-canvas-foreground/10 p-2 transition"
                  >
                    <Shape kind={it.kind} label={it.label} className="w-full h-full" />
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-canvas-foreground/50 mt-5 mb-2 font-medium uppercase tracking-wider">
                Equations
              </p>
              <div className="grid grid-cols-3 gap-2">
                {EQUATIONS.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => addItem("equation", eq)}
                    className="h-12 rounded-xl bg-canvas-foreground/5 hover:bg-canvas-foreground/10 font-serif italic text-canvas-foreground text-base transition"
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



