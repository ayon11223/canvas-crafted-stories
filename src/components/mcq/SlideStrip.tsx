import { ChevronLeft, ChevronRight, Plus, GripHorizontal } from "lucide-react";
import { useMcq, LABEL_STYLES, type Question } from "@/lib/mcq-store";
import { Shape } from "./Shape";
import { motion } from "framer-motion";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SlideStrip() {
  const { questions, currentId, setCurrent, addQuestion, reorderQuestions } = useMcq();
  const idx = questions.findIndex((q) => q.id === currentId);

  // Long-press to start drag: TouchSensor delay + PointerSensor delay for mouse.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 300, tolerance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 6 } }),
  );

  const go = (d: number) => {
    const next = idx + d;
    if (next >= 0 && next < questions.length) setCurrent(questions[next].id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = questions.map((q) => q.id);
    const next = arrayMove(
      ids,
      ids.indexOf(String(e.active.id)),
      ids.indexOf(String(e.over.id)),
    );
    reorderQuestions(next);
  };

  return (
    <div className="px-2 pt-1.5 pb-1.5 bg-background border-t border-border/60" data-no-swipe>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="size-6 rounded-md bg-card grid place-items-center disabled:opacity-30 border border-border shrink-0"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-stretch gap-2 px-1 w-fit mx-auto">
                {questions.map((q, i) => (
                  <SlideThumb
                    key={q.id}
                    q={q}
                    index={i}
                    active={q.id === currentId}
                    onClick={() => setCurrent(q.id)}
                  />
                ))}
                <button
                  onClick={addQuestion}
                  className="shrink-0 w-[88px] h-[60px] rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 grid place-items-center self-center"
                  aria-label="Add slide"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx === questions.length - 1}
          className="size-6 rounded-md bg-card grid place-items-center disabled:opacity-30 border border-border shrink-0"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function SlideThumb({
  q,
  index,
  active,
  onClick,
}: {
  q: Question;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const renderLabel = LABEL_STYLES.find((s) => s.id === q.labelStyle)!.render;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: q.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
      }}
      className="flex items-center gap-1.5 shrink-0"
    >
      <span
        className={`text-[10px] font-medium tabular-nums ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {index + 1}
      </span>
      <motion.button
        layout
        onClick={onClick}
        {...attributes}
        {...listeners}
        className={`relative w-[88px] h-[60px] rounded-md overflow-hidden text-left transition touch-none ${
          active
            ? "ring-2 ring-primary shadow-pop"
            : "ring-1 ring-border hover:ring-foreground/30"
        } ${isDragging ? "shadow-pop ring-2 ring-primary scale-105" : ""}`}
        style={{ backgroundColor: "var(--color-canvas)" }}
      >
        {isDragging && (
          <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground rounded-sm p-0.5 z-10">
            <GripHorizontal className="size-2.5" />
          </div>
        )}
        <div className="absolute inset-0 p-1.5 flex flex-col gap-0.5">
          <div className="text-canvas-foreground text-[6px] leading-[1.15] font-medium line-clamp-2 min-h-[12px]">
            {q.text || (
              <span className="text-canvas-foreground/40">Untitled</span>
            )}
          </div>
          {q.items.length > 0 && (
            <div className="relative flex-1 min-h-[14px] rounded-[2px] bg-canvas-foreground/5 overflow-hidden">
              {q.items.map((it) => (
                <div
                  key={it.id}
                  className="absolute"
                  style={{
                    left: `${it.x * 100}%`,
                    top: `${it.y * 100}%`,
                    width: `${it.w * 100}%`,
                    height: `${it.h * 100}%`,
                  }}
                >
                  {it.kind === "text" ? (
                    <div className="w-full h-full text-canvas-foreground/80 text-[4px] leading-none truncate">
                      {it.label || "T"}
                    </div>
                  ) : it.kind === "image" ? (
                    <div className="w-full h-full bg-canvas-foreground/15 rounded-[1px]" />
                  ) : it.kind === "table" || it.kind === "matrix" ? (
                    <div className="w-full h-full border border-canvas-foreground/40 rounded-[1px] bg-canvas-foreground/5" />
                  ) : (
                    <Shape kind={it.kind} className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex-1 flex flex-col gap-[1px] justify-end">
            {q.options.slice(0, 4).map((o, i) => (
              <div key={o.id} className="flex items-center gap-0.5">
                <span
                  className={`text-[5px] font-semibold leading-none w-[7px] h-[7px] grid place-items-center rounded-[2px] ${
                    o.correct
                      ? "bg-primary text-primary-foreground"
                      : "bg-canvas-foreground/10 text-canvas-foreground/70"
                  }`}
                >
                  {renderLabel(i)}
                </span>
                <span className="text-canvas-foreground/70 text-[5px] leading-none truncate flex-1">
                  {o.text || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.button>
    </div>
  );
}



