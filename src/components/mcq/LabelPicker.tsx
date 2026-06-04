import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Check } from "lucide-react";
import { LABEL_STYLES, useCurrentQuestion, useMcq } from "@/lib/mcq-store";

export function LabelPicker() {
  const { labelPickerOpen, setLabelPickerOpen, setLabelStyle } = useMcq();
  const q = useCurrentQuestion();

  const close = () => setLabelPickerOpen(false);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) close();
  };

  return (
    <AnimatePresence>
      {labelPickerOpen && (
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
            <div className="mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-canvas-foreground/20" />
            <div className="px-5 py-3">
              <h3 className="font-display font-semibold text-base text-canvas-foreground">Choice labels</h3>
              <p className="text-xs text-canvas-foreground/60 mt-0.5">Pick how options are labelled.</p>
              <div className="mt-4 space-y-1.5">
                {LABEL_STYLES.map((s) => {
                  const active = s.id === q.labelStyle;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setLabelStyle(s.id);
                        close();
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition ${
                        active
                          ? "bg-canvas-foreground/15 ring-1 ring-canvas-foreground/40"
                          : "bg-canvas-foreground/5 hover:bg-canvas-foreground/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 font-display font-semibold text-sm text-canvas-foreground">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="size-7 rounded-md bg-canvas-foreground/10 grid place-items-center"
                            >
                              {s.render(i)}
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-canvas-foreground/70">{s.name}</span>
                      </div>
                      {active && <Check className="size-4 text-canvas-foreground" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



