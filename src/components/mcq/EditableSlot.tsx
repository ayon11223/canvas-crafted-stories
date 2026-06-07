import { useEffect, useRef } from "react";
import { useMcq, type SlotNode } from "@/lib/mcq-store";
import { Equation } from "./Equation";

interface Props {
  itemId: string;
  nodeId: string | null; // null = top-level item slot
  slotKey: string;
  value: string;
  children?: SlotNode[];
  placeholder?: string;
  className?: string;
}

export function EditableSlot({ itemId, nodeId, slotKey, value, children, placeholder, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { activeSlot, setActiveSlot, updateSlotNode, updateItem } = useMcq();
  const isActive =
    activeSlot?.itemId === itemId &&
    activeSlot?.nodeId === nodeId &&
    activeSlot?.slotKey === slotKey;

  // Keep DOM text in sync with store value when not focused.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerText !== value) {
      el.innerText = value;
    }
  }, [value]);

  const commit = () => {
    const text = ref.current?.innerText ?? "";
    if (text === value) return;
    if (nodeId === null) {
      // top-level slot lives directly on item (value stored as slotKey→value map via slots empty + label trick)
      // We store text in item.slots[slotKey]'s first text node — simplest: use updateItem with a synthetic node.
      const item = useMcq.getState().questions
        .find((q) => q.id === useMcq.getState().currentId)!
        .items.find((it) => it.id === itemId);
      if (!item) return;
      const slots = { ...(item.slots ?? {}) };
      const arr = slots[slotKey] ?? [];
      const first = arr.find((n) => n.kind === "text");
      if (first) {
        slots[slotKey] = arr.map((n) => (n.id === first.id ? { ...n, value: text } : n));
      } else {
        slots[slotKey] = [
          { id: Math.random().toString(36).slice(2, 9), kind: "text", value: text },
          ...arr,
        ];
      }
      updateItem(itemId, { slots });
    } else {
      updateSlotNode(itemId, nodeId, { value: text });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
      return;
    }
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const atStart = range.startOffset === 0 && range.endOffset === 0;
    const atEnd =
      range.endOffset === (el.textContent?.length ?? 0) &&
      range.startOffset === range.endOffset;

    if ((e.key === "ArrowLeft" && atStart) || (e.key === "ArrowRight" && atEnd)) {
      const root = el.closest("[data-canvas-root]");
      if (!root) return;
      const all = Array.from(root.querySelectorAll<HTMLElement>('[contenteditable="true"]'));
      const idx = all.indexOf(el);
      const next = e.key === "ArrowLeft" ? all[idx - 1] : all[idx + 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  };

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 px-0.5 rounded ${
        isActive ? "ring-1 ring-primary/60 bg-primary/10" : "hover:bg-canvas-foreground/5"
      } ${className ?? ""}`}
      data-no-swipe
    >
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setActiveSlot({ itemId, nodeId, slotKey })}
        onBlur={() => {
          commit();
          // Delay clearing so picker taps can read activeSlot
          setTimeout(() => {
            const s = useMcq.getState().activeSlot;
            if (s?.itemId === itemId && s?.nodeId === nodeId && s?.slotKey === slotKey) {
              useMcq.getState().setActiveSlot(null);
            }
          }, 200);
        }}
        onInput={commit}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        className="outline-none min-w-[0.6em] inline-block"
        style={{ caretColor: "currentColor" }}
        data-placeholder={placeholder ?? ""}
      />
      {children?.map((child) =>
        child.kind === "smart-equation" ? (
          <Equation key={child.id} itemId={itemId} node={child} />
        ) : null,
      )}
    </span>
  );
}