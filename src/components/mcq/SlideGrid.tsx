import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Trash2, CheckSquare, Square, Plus } from "lucide-react";
import { useMcq, LABEL_STYLES, type Question } from "@/lib/mcq-store";
import { Shape } from "./Shape";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

export function SlideGrid() {
  const {
    questions,
    currentId,
    gridViewOpen,
    setGridViewOpen,
    setCurrent,
    reorderQuestions,
    addQuestion,
    duplicateQuestion,
    removeQuestion,
    duplicateQuestions,
    removeQuestions,
  } = useMcq();

  const [selected, setSelected] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  const close = () => {
    setGridViewOpen(false);
    setSelected([]);
    setSelectMode(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const enterSelect = (id: string) => {
    setSelectMode(true);
    setSelected([id]);
  };

  const onTap = (id: string) => {
    if (selectMode) {
      toggleSelect(id);
    } else {
      setCurrent(id);
      close();
    }
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

  const allSelected = selected.length === questions.length && questions.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : questions.map((q) => q.id));

  return (
    <AnimatePresence>
      {gridViewOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-background flex flex-col pt-[env(safe-area-inset-top)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border bg-toolbar">
            <button onClick={close} aria-label="Close" className="size-9 grid place-items-center rounded-md hover:bg-foreground/5">
              <X className="size-5" />
            </button>
            <div className="text-sm font-medium">
              {selectMode ? `${selected.length} selected` : `${questions.length} slides`}
            </div>
            <div className="flex items-center gap-1">
              {selectMode ? (
                <button
                  onClick={toggleAll}
                  className="text-xs px-2 py-1.5 rounded-md hover:bg-foreground/5"
                >
                  {allSelected ? "Clear" : "All"}
                </button>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  className="text-xs px-2 py-1.5 rounded-md hover:bg-foreground/5"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-3 py-4 pb-28">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToParentElement]}>
              <SortableContext items={questions.map((q) => q.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-3">
                  {questions.map((q, i) => (
                    <GridThumb
                      key={q.id}
                      q={q}
                      index={i}
                      active={q.id === currentId}
                      selected={selected.includes(q.id)}
                      selectMode={selectMode}
                      onTap={() => onTap(q.id)}
                      onLongPress={() => enterSelect(q.id)}
                    />
                  ))}
                  <button
                    onClick={() => {
                      addQuestion();
                      close();
                    }}
                    className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary/60 hover:text-primary text-muted-foreground grid place-items-center"
                  >
                    <Plus className="size-6" />
                  </button>
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Action bar */}
          <AnimatePresence>
            {selectMode && selected.length > 0 && (
              <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                exit={{ y: 80 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-toolbar border-t border-border px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] flex items-center justify-around"
              >
                <ActionBtn
                  icon={<Copy className="size-5" />}
                  label="Duplicate"
                  onClick={() => {
                    duplicateQuestions(selected);
                    setSelected([]);
                    setSelectMode(false);
                  }}
                />
                <ActionBtn
                  icon={<Trash2 className="size-5" />}
                  label="Delete"
                  destructive
                  onClick={() => {
                    removeQuestions(selected);
                    setSelected([]);
                    setSelectMode(false);
                  }}
                />
                <ActionBtn
                  icon={<CheckSquare className="size-5" />}
                  label="Done"
                  onClick={() => {
                    setSelected([]);
                    setSelectMode(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md ${
        destructive ? "text-destructive" : "text-foreground/80"
      } hover:bg-foreground/5`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function GridThumb({
  q,
  index,
  active,
  selected,
  selectMode,
  onTap,
  onLongPress,
}: {
  q: Question;
  index: number;
  active: boolean;
  selected: boolean;
  selectMode: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const { duplicateQuestion, removeQuestion } = useMcq();
  const renderLabel = LABEL_STYLES.find((s) => s.id === q.labelStyle)!.render;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: q.id,
  });

  // Long-press detection
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressed = false;

  const onPointerDown = () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      onLongPress();
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };
  const onClick = () => {
    cancelPress();
    if (longPressed) return;
    onTap();
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
      }}
      className="relative"
    >
      <button
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        {...attributes}
        {...listeners}
        className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden text-left transition touch-none ${
          active
            ? "ring-2 ring-primary shadow-pop"
            : selected
              ? "ring-2 ring-primary"
              : "ring-1 ring-border"
        } ${isDragging ? "shadow-pop scale-105" : ""}`}
        style={{ backgroundColor: "var(--color-canvas)" }}
      >
        <div className="absolute inset-0 p-2 flex flex-col gap-1">
          <div className="text-canvas-foreground text-[9px] leading-tight font-medium line-clamp-3 min-h-[24px]">
            {q.text || <span className="text-canvas-foreground/40">Untitled</span>}
          </div>
          {q.items.length > 0 && (
            <div className="relative flex-1 min-h-[40px] rounded bg-canvas-foreground/5 overflow-hidden">
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
                    <div className="w-full h-full text-canvas-foreground/80 text-[7px] leading-none truncate">
                      {it.label || "T"}
                    </div>
                  ) : it.kind === "image" ? (
                    <div className="w-full h-full bg-canvas-foreground/15 rounded-sm" />
                  ) : it.kind === "table" || it.kind === "matrix" ? (
                    <div className="w-full h-full border border-canvas-foreground/40 rounded-sm bg-canvas-foreground/5" />
                  ) : (
                    <Shape kind={it.kind} className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-[2px] justify-end mt-auto">
            {q.options.slice(0, 4).map((o, i) => (
              <div key={o.id} className="flex items-center gap-1">
                <span
                  className={`text-[7px] font-semibold leading-none w-[10px] h-[10px] grid place-items-center rounded-[2px] ${
                    o.correct
                      ? "bg-primary text-primary-foreground"
                      : "bg-canvas-foreground/10 text-canvas-foreground/70"
                  }`}
                >
                  {renderLabel(i)}
                </span>
                <span className="text-canvas-foreground/70 text-[7px] leading-none truncate flex-1">
                  {o.text || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Page number badge */}
        <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-background/80 backdrop-blur text-foreground text-[10px] font-semibold grid place-items-center tabular-nums">
          {index + 1}
        </div>

        {/* Select checkbox */}
        {selectMode && (
          <div className="absolute top-1.5 left-1.5">
            {selected ? (
              <div className="size-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
                <CheckSquare className="size-3" />
              </div>
            ) : (
              <div className="size-5 rounded-full bg-background/80 backdrop-blur text-foreground grid place-items-center">
                <Square className="size-3" />
              </div>
            )}
          </div>
        )}
      </button>

      {/* Per-card quick actions — stacked vertically below the page number */}
      {!selectMode && (
        <div className="absolute top-8 right-1.5 flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateQuestion(q.id);
            }}
            className="size-5 rounded-full bg-background/80 backdrop-blur text-foreground/80 hover:text-foreground grid place-items-center shadow-pop"
            aria-label="Duplicate"
          >
            <Copy className="size-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeQuestion(q.id);
            }}
            className="size-5 rounded-full bg-background/80 backdrop-blur text-destructive hover:bg-destructive/10 grid place-items-center shadow-pop"
            aria-label="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}



