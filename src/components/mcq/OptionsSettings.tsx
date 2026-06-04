import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useState } from "react";
import {
  ListChecks,
  Sigma,
  CheckCircle2,
  Eraser,
  ClipboardPaste,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { useCurrentQuestion, useMcq, type TickStyle } from "@/lib/mcq-store";

const TICK_OPTIONS: { id: TickStyle; name: string; desc: string }[] = [
  { id: "none", name: "No tick (default)", desc: "Hide tick until solution is shown" },
  { id: "label", name: "On the label", desc: "Check mark replaces A · B · C" },
  { id: "green", name: "Highlight green", desc: "Whole option turns green" },
  { id: "side", name: "Side badge", desc: "Small tick on the right" },
];

export function OptionsSettings() {
  const {
    optionsSettingsOpen,
    setOptionsSettingsOpen,
    setLabelPickerOpen,
    clearOptions,
    setTickStyle,
    cycleCanvasSize,
    addItem,
  } = useMcq();
  const q = useCurrentQuestion();
  const [tickOpen, setTickOpen] = useState(false);

  const close = () => {
    setOptionsSettingsOpen(false);
    setTickOpen(false);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) close();
  };

  const items = [
    {
      icon: ListChecks,
      label: "Choice type",
      hint: q.labelStyle,
      onClick: () => {
        close();
        setLabelPickerOpen(true);
      },
    },
    { icon: Sigma, label: "Equations", hint: "Coming soon", onClick: () => {} },
    {
      icon: CheckCircle2,
      label: "Tick mark",
      hint: TICK_OPTIONS.find((t) => t.id === q.tickStyle)?.name,
      onClick: () => setTickOpen((v) => !v),
      expanded: tickOpen,
    },
    {
      icon: ImageIcon,
      label: "Add image",
      hint: "Expands canvas",
      onClick: () => {
        if (q.canvasSize === "closed") cycleCanvasSize();
        addItem("text", "Image");
        close();
      },
    },
    {
      icon: Eraser,
      label: "Clear all",
      hint: "Reset choices",
      destructive: true,
      onClick: () => {
        clearOptions();
        close();
      },
    },
    { icon: ClipboardPaste, label: "Paste", hint: "Coming soon", onClick: () => {} },
    { icon: FileText, label: "Question format", hint: "Coming soon", onClick: () => {} },
  ];

  return (
    <AnimatePresence>
      {optionsSettingsOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 canvas-paper rounded-t-3xl shadow-pop pb-[env(safe-area-inset-bottom)] max-h-[85vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-canvas-foreground/20 shrink-0" />
            <div className="px-5 pt-1 pb-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-base text-canvas-foreground">
                    Choice settings
                  </h3>
                  <p className="text-xs text-canvas-foreground/60 mt-0.5">
                    Configure how this question's answers look and behave.
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="Close"
                  className="size-9 rounded-full border border-canvas-foreground/15 grid place-items-center text-canvas-foreground/70 shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 space-y-1.5">
                {items.map((it) => (
                  <div key={it.label}>
                    <button
                      onClick={it.onClick}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                        it.destructive
                          ? "bg-destructive/10 hover:bg-destructive/20 text-destructive"
                          : "bg-canvas-foreground/5 hover:bg-canvas-foreground/10 text-canvas-foreground"
                      }`}
                    >
                      <span
                        className={`size-9 rounded-lg grid place-items-center shrink-0 ${
                          it.destructive ? "bg-destructive/20" : "bg-canvas-foreground/10"
                        }`}
                      >
                        <it.icon className="size-4" />
                      </span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{it.label}</div>
                        {it.hint && (
                          <div className="text-[11px] opacity-70">{it.hint}</div>
                        )}
                      </div>
                      <ChevronRight
                        className={`size-4 opacity-60 transition ${it.expanded ? "rotate-90" : ""}`}
                      />
                    </button>
                    {it.label === "Tick mark" && (
                      <AnimatePresence>
                        {tickOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-12 pr-2 py-2 space-y-1">
                              {TICK_OPTIONS.map((t) => {
                                const active = t.id === q.tickStyle;
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => {
                                      setTickStyle(t.id);
                                      setTickOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition ${
                                      active
                                        ? "bg-canvas-foreground/15 ring-1 ring-canvas-foreground/40"
                                        : "hover:bg-canvas-foreground/5"
                                    }`}
                                  >
                                    <div className="text-left">
                                      <div className="text-sm text-canvas-foreground">{t.name}</div>
                                      <div className="text-[11px] text-canvas-foreground/60">
                                        {t.desc}
                                      </div>
                                    </div>
                                    {active && <Check className="size-4 text-canvas-foreground" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



