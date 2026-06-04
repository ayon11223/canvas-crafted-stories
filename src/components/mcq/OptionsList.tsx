import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Check, Shuffle, Settings2, Lock, Eraser } from "lucide-react";
import { LABEL_STYLES, useCurrentQuestion, useMcq, type Option } from "@/lib/mcq-store";
import { useLongPress } from "@/hooks/use-long-press";

export function OptionsList() {
  const q = useCurrentQuestion();
  const { reorderOptions, setLabelPickerOpen, shuffleOptions, autoFillOptions, setOptionsSettingsOpen, clearOptions } = useMcq();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const renderLabel = LABEL_STYLES.find((s) => s.id === q.labelStyle)!.render;

  const longPress = useLongPress(() => setLabelPickerOpen(true));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = q.options.map((o) => o.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    reorderOptions(next);
  };

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={autoFillOptions}
          className="flex items-center gap-1.5 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/60 rounded-full pl-2 pr-3 py-1.5 hover:text-foreground transition"
        >
          <Lock className="size-3" /> Auto-Fill
        </button>
        <div className="flex items-center gap-1">
          <IconBtn label="Shuffle" onClick={shuffleOptions}>
            <Shuffle className="size-4" />
          </IconBtn>
          <IconBtn label="Clear all choices" onClick={clearOptions}>
            <Eraser className="size-4" />
          </IconBtn>
          <IconBtn label="Choice settings" onClick={() => setOptionsSettingsOpen(true)} accent>
            <Settings2 className="size-4" />
          </IconBtn>
        </div>
      </div>
      <div className="rounded-2xl bg-card p-3 shadow-soft border border-border">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
          <SortableContext items={q.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {q.options.map((o, i) => (
                <SortableOption
                  key={o.id}
                  option={o}
                  label={renderLabel(i)}
                  labelHandlers={longPress}
                  tickStyle={q.tickStyle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`size-8 grid place-items-center rounded-full transition ${
        accent
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
    >
      {children}
    </button>
  );
}

function SortableOption({
  option,
  label,
  labelHandlers,
  tickStyle,
}: {
  option: Option;
  label: string;
  labelHandlers: ReturnType<typeof useLongPress>;
  tickStyle: "label" | "green" | "side" | "none";
}) {
  const { setOption } = useMcq();
  const [focused, setFocused] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.id,
  });

  const showCheckInLabel = tickStyle === "label" && option.correct;
  const greenRow = tickStyle === "green" && option.correct;
  const sideTick = tickStyle === "side" && option.correct;

  const clearThis = () => setOption(option.id, { text: "", correct: false });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
      }}
      className={`group flex items-center gap-2 rounded-xl pl-1 pr-2 transition ${
        greenRow ? "bg-emerald-500/15 ring-1 ring-emerald-500/40" : "bg-secondary/60"
      } ${isDragging ? "shadow-pop ring-1 ring-primary/40" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-muted-foreground hover:text-foreground cursor-grab touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <button
        {...labelHandlers}
        onClick={() => setOption(option.id, { correct: !option.correct })}
        className={`relative font-display font-semibold text-sm size-8 rounded-lg grid place-items-center shrink-0 transition ${
          showCheckInLabel
            ? "bg-primary text-primary-foreground"
            : greenRow
              ? "bg-emerald-500 text-white"
              : "bg-background text-foreground"
        }`}
      >
        {showCheckInLabel ? <Check className="size-4" /> : label}
      </button>
      <input
        value={option.text}
        onChange={(e) => setOption(option.id, { text: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Option ${label}`}
        className="flex-1 min-w-0 bg-transparent text-sm py-3 outline-none placeholder:text-muted-foreground/60"
      />
      <div className="flex items-center gap-1 shrink-0">
        <span
          className={`size-5 rounded-full grid place-items-center transition ${
            sideTick ? "bg-emerald-500 opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!sideTick}
        >
          <Check className="size-3 text-white" />
        </span>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearThis}
          className={`p-2 text-muted-foreground/60 hover:text-destructive transition ${
            focused && option.text ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Clear option"
          tabIndex={focused && option.text ? 0 : -1}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}



