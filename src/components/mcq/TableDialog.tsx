import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useMcq } from "@/lib/mcq-store";

export function TableDialog() {
  const { tableDialog, setTableDialog, addTable } = useMcq();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  useEffect(() => {
    if (tableDialog) {
      setRows(tableDialog.mode === "matrix" ? 2 : 3);
      setCols(tableDialog.mode === "matrix" ? 2 : 3);
    }
  }, [tableDialog]);

  if (!tableDialog) return null;
  const isMatrix = tableDialog.mode === "matrix";
  const close = () => setTableDialog(null);

  return (
    <AnimatePresence>
      {tableDialog && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-5 shadow-pop"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-base">
                  {isMatrix ? "New matrix" : "New table"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose rows and columns. You can edit the values after.
                </p>
              </div>
              <button
                onClick={close}
                className="size-8 -mt-1 -mr-1 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <Stepper label="Rows" value={rows} setValue={setRows} min={1} max={10} />
              <Stepper label="Columns" value={cols} setValue={setCols} min={1} max={10} />
            </div>

            <div className="mt-5 grid place-items-center">
              <div className="rounded-lg border border-border p-2 bg-background/40">
                <div
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${cols}, 18px)` }}
                >
                  {Array.from({ length: rows * cols }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 ${
                        isMatrix ? "bg-primary/20" : "bg-secondary"
                      } rounded-[2px]`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={close}
                className="flex-1 h-10 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                onClick={() => addTable(rows, cols, tableDialog.mode)}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Insert
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stepper({
  label,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setValue(Math.max(min, value - 1))}
          className="size-8 rounded-full bg-background grid place-items-center hover:bg-background/70 disabled:opacity-40"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-sm font-display font-semibold tabular-nums">
          {value}
        </span>
        <button
          onClick={() => setValue(Math.min(max, value + 1))}
          className="size-8 rounded-full bg-background grid place-items-center hover:bg-background/70 disabled:opacity-40"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}



