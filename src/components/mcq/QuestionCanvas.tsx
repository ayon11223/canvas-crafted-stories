import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronsUpDown, X, Plus, Trash2 } from "lucide-react";
import { useCurrentQuestion, useMcq, type CanvasItem } from "@/lib/mcq-store";
import { Shape } from "./Shape";

const HEIGHTS = { closed: 120, half: 280, full: 460 } as const;

export function QuestionCanvas() {
  const q = useCurrentQuestion();
  const { updateCurrent, cycleCanvasSize, shrinkCanvas, setShapePicker } = useMcq();
  const open = q.canvasSize !== "closed";

  return (
    <div className="px-4 pt-4">
      <motion.div
        layout
        className="canvas-paper rounded-2xl p-4 text-canvas-foreground shadow-soft relative overflow-hidden"
        animate={{ height: HEIGHTS[q.canvasSize] }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className="flex items-start gap-2 h-full">
          <span className="font-display font-semibold text-lg leading-none mt-1">
            {numberOf(q.id)}.
          </span>
          {open ? (
            <FigureArea />
          ) : (
            <textarea
              value={q.text}
              onChange={(e) => updateCurrent({ text: e.target.value })}
              placeholder="Type your question..."
              className="flex-1 h-full bg-transparent resize-none outline-none text-[15px] leading-snug placeholder:text-canvas-foreground/40"
            />
          )}
        </div>

        {open && (
          <div
            data-no-swipe
            className="absolute bottom-2 left-3 right-12"
          >
            <input
              value={q.footer ?? ""}
              onChange={(e) => updateCurrent({ footer: e.target.value })}
              placeholder="Footer / Note…"
              className="w-full bg-transparent border-t border-canvas-foreground/15 pt-1.5 text-[11px] text-canvas-foreground/80 outline-none placeholder:text-canvas-foreground/40"
            />
          </div>
        )}

        {open && (
          <button
            onClick={q.canvasSize === "full" ? shrinkCanvas : cycleCanvasSize}
            className="absolute bottom-1.5 right-2 size-7 rounded-full text-canvas-foreground/60 hover:text-canvas-foreground hover:bg-canvas-foreground/5 grid place-items-center"
            aria-label={q.canvasSize === "full" ? "Close canvas" : "Expand canvas"}
          >
            {q.canvasSize === "full" ? <X className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
          </button>
        )}

        {!open && (
          <button
            onClick={cycleCanvasSize}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] text-canvas-foreground/70 hover:text-canvas-foreground px-2 py-0.5 rounded-full hover:bg-canvas-foreground/5"
          >
            <ChevronDown className="size-3" /> Add figure
          </button>
        )}

        {open && (
          <button
            onClick={() => setShapePicker(true)}
            className="absolute top-2 right-2 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-pop"
            aria-label="Add shape"
          >
            <Plus className="size-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

function numberOf(id: string) {
  const idx = useMcq.getState().questions.findIndex((x) => x.id === id);
  return idx + 1;
}

function FigureArea() {
  const q = useCurrentQuestion();
  const { selectedItemId, selectItem, updateCurrent } = useMcq();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="flex-1 h-full relative"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) selectItem(null);
      }}
    >
      <textarea
        data-no-swipe
        value={q.text}
        onChange={(e) => updateCurrent({ text: e.target.value })}
        placeholder="Type your question..."
        className="absolute top-0 left-0 right-0 bg-transparent resize-none outline-none text-[13px] leading-snug text-canvas-foreground/90 placeholder:text-canvas-foreground/40 h-10"
      />
      <AnimatePresence>
        {q.items.map((it) => (
          <DraggableItem
            key={it.id}
            item={it}
            containerRef={ref}
            selected={selectedItemId === it.id}
          />
        ))}
      </AnimatePresence>
      {/* empty state intentionally blank */}
    </div>
  );
}

function DraggableItem({
  item,
  containerRef,
  selected,
}: {
  item: CanvasItem;
  containerRef: React.RefObject<HTMLDivElement | null>;
  selected: boolean;
}) {
  const { updateItem, updateItemCell, selectItem, removeItem } = useMcq();
  const isText = item.kind === "text";
  const isImage = item.kind === "image";
  const isTable = item.kind === "table" || item.kind === "matrix";
  const isMatrix = item.kind === "matrix";
  const [editing, setEditing] = useState(false);
  const draggedRef = useRef(false);

  const startDrag = (e: ReactPointerEvent, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    selectItem(item.id);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { x: item.x, y: item.y, w: item.w, h: item.h };
    draggedRef.current = false;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      if (Math.abs(dx) + Math.abs(dy) > 0.005) draggedRef.current = true;
      if (mode === "move") {
        updateItem(item.id, {
          x: clamp(start.x + dx, 0, Math.max(0, 1 - start.w)),
          y: clamp(start.y + dy, 0, Math.max(0, 1 - start.h)),
        });
      } else {
        updateItem(item.id, {
          w: clamp(start.w + dx, 0.08, 1 - start.x),
          h: clamp(start.h + dy, 0.06, 1 - start.y),
        });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <motion.div
      data-canvas-item
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="absolute select-none"
      style={{
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        width: `${item.w * 100}%`,
        height: `${item.h * 100}%`,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (isText && editing) return;
        if (isTable && selected) return;
        startDrag(e, "move");
      }}
      onDoubleClick={() => {
        if (isText) setEditing(true);
      }}
    >
      <div
        className={`relative w-full h-full rounded-md ${
          selected ? "ring-2 ring-primary ring-offset-1 ring-offset-canvas" : ""
        } ${isText && !editing ? "cursor-move" : ""}`}
      >
        {isText ? (
          editing ? (
            <input
              autoFocus
              value={item.label ?? ""}
              onChange={(e) => updateItem(item.id, { label: e.target.value })}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setEditing(false);
              }}
              placeholder="Text"
              className="w-full h-full bg-transparent border-0 outline-none text-canvas-foreground text-[14px] leading-tight px-1"
              style={{ touchAction: "auto" }}
            />
          ) : (
            <div className="w-full h-full px-1 text-[14px] leading-tight text-canvas-foreground flex items-center overflow-hidden whitespace-pre-wrap break-words">
              {item.label?.trim() ? item.label : <span className="text-canvas-foreground/40">Double-tap to edit</span>}
            </div>
          )
        ) : isImage ? (
          <div className="w-full h-full rounded-md bg-canvas-foreground/10 border border-dashed border-canvas-foreground/30 grid place-items-center text-canvas-foreground/50 text-[11px]">
            🖼 Image
          </div>
        ) : isTable ? (
          <TableGrid
            item={item}
            isMatrix={isMatrix}
            onCellChange={(r, c, v) => updateItemCell(item.id, r, c, v)}
            interactive={selected}
          />
        ) : (
          <Shape
            kind={item.kind}
            label={item.label}
            className="w-full h-full pointer-events-none"
          />
        )}
        {selected && (
          <>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                removeItem(item.id);
              }}
              className="absolute -top-3 -left-3 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-pop"
            >
              <Trash2 className="size-3" />
            </button>
            <div
              onPointerDown={(e) => startDrag(e, "resize")}
              className="absolute -bottom-2 -right-2 size-5 rounded-full bg-primary border-2 border-canvas cursor-se-resize"
              style={{ touchAction: "none" }}
            />
            {isTable && (
              <div
                onPointerDown={(e) => startDrag(e, "move")}
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-medium shadow-pop cursor-move"
                style={{ touchAction: "none" }}
              >
                drag
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function TableGrid({
  item,
  isMatrix,
  onCellChange,
  interactive,
}: {
  item: CanvasItem;
  isMatrix: boolean;
  onCellChange: (r: number, c: number, v: string) => void;
  interactive: boolean;
}) {
  const rows = item.rows ?? item.data?.length ?? 1;
  const cols = item.cols ?? item.data?.[0]?.length ?? 1;
  const bracket = isMatrix ? "border-l-2 border-r-2 border-canvas-foreground/80 mx-1.5" : "";

  return (
    <div className={`w-full h-full flex ${isMatrix ? "items-stretch" : ""}`}>
      {isMatrix && <div className="w-1 border-l-2 border-y-2 border-canvas-foreground/80 rounded-l-sm" />}
      <div
        className={`flex-1 grid ${isMatrix ? "" : "border border-canvas-foreground/40 rounded-sm overflow-hidden"} ${bracket}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <input
              key={`${r}-${c}`}
              value={item.data?.[r]?.[c] ?? ""}
              onChange={(e) => onCellChange(r, c, e.target.value)}
              onPointerDown={(e) => {
                if (interactive) e.stopPropagation();
              }}
              placeholder={isMatrix ? "0" : ""}
              readOnly={!interactive}
              className={`min-w-0 bg-transparent text-canvas-foreground text-[11px] text-center outline-none px-0.5 ${
                isMatrix ? "" : "border border-canvas-foreground/15"
              }`}
              style={{ touchAction: interactive ? "auto" : "none" }}
            />
          )),
        )}
      </div>
      {isMatrix && <div className="w-1 border-r-2 border-y-2 border-canvas-foreground/80 rounded-r-sm" />}
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}



