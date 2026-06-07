import { create } from "zustand";

export type LabelStyle = "A" | "1" | "i" | "ka" | "I" | "a";

export const LABEL_STYLES: { id: LabelStyle; name: string; render: (i: number) => string }[] = [
  { id: "A", name: "A · B · C", render: (i) => String.fromCharCode(65 + i) },
  { id: "a", name: "a · b · c", render: (i) => String.fromCharCode(97 + i) },
  { id: "1", name: "1 · 2 · 3", render: (i) => String(i + 1) },
  { id: "i", name: "i · ii · iii", render: (i) => ["i", "ii", "iii", "iv", "v", "vi"][i] ?? String(i + 1) },
  { id: "I", name: "I · II · III", render: (i) => ["I", "II", "III", "IV", "V", "VI"][i] ?? String(i + 1) },
  { id: "ka", name: "ক · খ · গ", render: (i) => ["ক", "খ", "গ", "ঘ", "ঙ", "চ"][i] ?? String(i + 1) },
];

export type ShapeKind =
  | "triangle"
  | "right-triangle"
  | "equilateral-triangle"
  | "isosceles-triangle"
  | "scalene-triangle"
  | "rhombus"
  | "square"
  | "rectangle"
  | "circle"
  | "venn"
  | "arc"
  | "cube"
  | "pyramid"
  | "cylinder"
  | "axis"
  | "line"
  | "equation"
  | "smart-equation"
  | "text"
  | "image"
  | "table"
  | "matrix"
  | "chart";

export type EquationTemplate =
  | "fraction"
  | "sqrt"
  | "nthroot"
  | "power"
  | "derivative";

export interface SlotNode {
  id: string;
  kind: "text" | "smart-equation";
  value?: string;
  template?: EquationTemplate;
  slots?: Record<string, SlotNode[]>;
}

export interface ActiveSlot {
  itemId: string;
  nodeId: string | null; // null = top-level item slot
  slotKey: string;
}

export interface CanvasItem {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  rotation?: number;
  rows?: number;
  cols?: number;
  data?: string[][];
  template?: EquationTemplate;
  slots?: Record<string, SlotNode[]>;
}

export interface Option {
  id: string;
  text: string;
  correct?: boolean;
}

export type CanvasSize = "closed" | "half" | "full";
export type TickStyle = "label" | "green" | "side" | "none";

export interface Question {
  id: string;
  text: string;
  items: CanvasItem[];
  figureOpen: boolean;
  canvasSize: CanvasSize;
  options: Option[];
  labelStyle: LabelStyle;
  tickStyle: TickStyle;
  solution: string;
  footer: string;
}

export type TableMode = "table" | "matrix";

interface State {
  questions: Question[];
  currentId: string;
  selectedItemId: string | null;
  shapePickerOpen: boolean;
  solutionOpen: boolean;
  labelPickerOpen: boolean;
  optionsSettingsOpen: boolean;
  insertMenuOpen: boolean;
  equationsPickerOpen: boolean;
  gridViewOpen: boolean;
  tableDialog: { mode: TableMode } | null;
  activeSlot: ActiveSlot | null;
  setActiveSlot: (s: ActiveSlot | null) => void;
  insertSlotNode: (target: ActiveSlot, node: SlotNode) => void;
  updateSlotNode: (itemId: string, nodeId: string, patch: Partial<SlotNode>) => void;
  addSmartEquation: (template: EquationTemplate) => void;
  setCurrent: (id: string) => void;
  addQuestion: () => void;
  reorderQuestions: (ids: string[]) => void;
  duplicateQuestion: (id: string) => void;
  removeQuestion: (id: string) => void;
  removeQuestions: (ids: string[]) => void;
  duplicateQuestions: (ids: string[]) => void;
  updateCurrent: (patch: Partial<Question>) => void;
  setOption: (id: string, patch: Partial<Option>) => void;
  reorderOptions: (ids: string[]) => void;
  addOption: () => void;
  removeOption: (id: string) => void;
  clearOptions: () => void;
  shuffleOptions: () => void;
  autoFillOptions: () => void;
  toggleFigure: () => void;
  cycleCanvasSize: () => void;
  shrinkCanvas: () => void;
  addItem: (kind: ShapeKind, label?: string) => void;
  addTable: (rows: number, cols: number, mode: TableMode) => void;
  updateItem: (id: string, patch: Partial<CanvasItem>) => void;
  updateItemCell: (id: string, r: number, c: number, value: string) => void;
  removeItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  setShapePicker: (v: boolean) => void;
  setSolutionOpen: (v: boolean) => void;
  setLabelPickerOpen: (v: boolean) => void;
  setOptionsSettingsOpen: (v: boolean) => void;
  setInsertMenuOpen: (v: boolean) => void;
  setEquationsPickerOpen: (v: boolean) => void;
  setTableDialog: (v: { mode: TableMode } | null) => void;
  setGridViewOpen: (v: boolean) => void;
  setLabelStyle: (s: LabelStyle) => void;
  setTickStyle: (s: TickStyle) => void;
  setSolution: (s: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function defaultSlotsFor(template: EquationTemplate): Record<string, SlotNode[]> {
  switch (template) {
    case "fraction":
      return { num: [], den: [] };
    case "sqrt":
      return { rad: [] };
    case "nthroot":
      return { idx: [], rad: [] };
    case "power":
      return { base: [], exp: [] };
    case "derivative":
      return { expr: [], wrt: [] };
  }
}

function insertIntoNode(
  slots: Record<string, SlotNode[]> | undefined,
  nodeId: string,
  slotKey: string,
  node: SlotNode,
): Record<string, SlotNode[]> | undefined {
  if (!slots) return slots;
  const out: Record<string, SlotNode[]> = {};
  for (const [k, arr] of Object.entries(slots)) {
    out[k] = arr.map((child) => {
      if (child.id === nodeId) {
        const childSlots = { ...(child.slots ?? {}) };
        childSlots[slotKey] = [...(childSlots[slotKey] ?? []), node];
        return { ...child, slots: childSlots };
      }
      return { ...child, slots: insertIntoNode(child.slots, nodeId, slotKey, node) };
    });
  }
  return out;
}

function patchNode(
  slots: Record<string, SlotNode[]> | undefined,
  nodeId: string,
  patch: Partial<SlotNode>,
): Record<string, SlotNode[]> | undefined {
  if (!slots) return slots;
  const out: Record<string, SlotNode[]> = {};
  for (const [k, arr] of Object.entries(slots)) {
    out[k] = arr.map((child) =>
      child.id === nodeId
        ? { ...child, ...patch }
        : { ...child, slots: patchNode(child.slots, nodeId, patch) },
    );
  }
  return out;
}

export const newSlotNode = (kind: SlotNode["kind"], extra: Partial<SlotNode> = {}): SlotNode => ({
  id: Math.random().toString(36).slice(2, 9),
  kind,
  value: "",
  ...extra,
  ...(kind === "smart-equation" && extra.template
    ? { slots: defaultSlotsFor(extra.template) }
    : {}),
});

const blankQuestion = (): Question => ({
  id: uid(),
  text: "",
  items: [],
  figureOpen: false,
  canvasSize: "closed",
  labelStyle: "A",
  tickStyle: "none",
  solution: "",
  footer: "",
  options: [
    { id: uid(), text: "" },
    { id: uid(), text: "" },
    { id: uid(), text: "" },
    { id: uid(), text: "" },
  ],
});

const initial: Question[] = Array.from({ length: 3 }, blankQuestion);

export const useMcq = create<State>((set, get) => ({
  questions: initial,
  currentId: initial[0].id,
  selectedItemId: null,
  shapePickerOpen: false,
  solutionOpen: false,
  labelPickerOpen: false,
  optionsSettingsOpen: false,
  insertMenuOpen: false,
  equationsPickerOpen: false,
  tableDialog: null,
  gridViewOpen: false,
  activeSlot: null,
  setActiveSlot: (s) => set({ activeSlot: s }),
  setGridViewOpen: (v) => set({ gridViewOpen: v }),
  insertSlotNode: (target, node) =>
    set((s) => ({
      questions: s.questions.map((q) => {
        if (q.id !== s.currentId) return q;
        return {
          ...q,
          items: q.items.map((it) => {
            if (it.id !== target.itemId) return it;
            if (target.nodeId === null) {
              const slots = { ...(it.slots ?? {}) };
              slots[target.slotKey] = [...(slots[target.slotKey] ?? []), node];
              return { ...it, slots };
            }
            return { ...it, slots: insertIntoNode(it.slots, target.nodeId, target.slotKey, node) };
          }),
        };
      }),
    })),
  updateSlotNode: (itemId, nodeId, patch) =>
    set((s) => ({
      questions: s.questions.map((q) => {
        if (q.id !== s.currentId) return q;
        return {
          ...q,
          items: q.items.map((it) => {
            if (it.id !== itemId) return it;
            return { ...it, slots: patchNode(it.slots, nodeId, patch) };
          }),
        };
      }),
    })),
  addSmartEquation: (template) => {
    const item: CanvasItem = {
      id: uid(),
      kind: "smart-equation",
      x: 0.2,
      y: 0.2,
      w: 0.45,
      h: 0.18,
      template,
      slots: defaultSlotsFor(template),
    };
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, items: [...q.items, item], figureOpen: true, canvasSize: q.canvasSize === "closed" ? "half" : q.canvasSize }
          : q,
      ),
      selectedItemId: item.id,
      equationsPickerOpen: false,
    }));
  },
  setCurrent: (id) => set({ currentId: id, selectedItemId: null }),
  addQuestion: () => {
    const q = blankQuestion();
    set((s) => ({ questions: [...s.questions, q], currentId: q.id }));
  },
  reorderQuestions: (ids) =>
    set((s) => ({
      questions: ids.map((id) => s.questions.find((q) => q.id === id)!).filter(Boolean),
    })),
  duplicateQuestion: (id) =>
    set((s) => {
      const src = s.questions.find((q) => q.id === id);
      if (!src) return s;
      const copy: Question = {
        ...src,
        id: uid(),
        items: src.items.map((it) => ({ ...it, id: uid(), data: it.data?.map((r) => r.slice()) })),
        options: src.options.map((o) => ({ ...o, id: uid() })),
      };
      const idx = s.questions.findIndex((q) => q.id === id);
      const next = [...s.questions];
      next.splice(idx + 1, 0, copy);
      return { questions: next };
    }),
  removeQuestion: (id) =>
    set((s) => {
      const next = s.questions.filter((q) => q.id !== id);
      if (next.length === 0) {
        const q = blankQuestion();
        return { questions: [q], currentId: q.id };
      }
      const currentId = s.currentId === id ? next[0].id : s.currentId;
      return { questions: next, currentId };
    }),
  removeQuestions: (ids) =>
    set((s) => {
      const remove = new Set(ids);
      const next = s.questions.filter((q) => !remove.has(q.id));
      if (next.length === 0) {
        const q = blankQuestion();
        return { questions: [q], currentId: q.id };
      }
      const currentId = remove.has(s.currentId) ? next[0].id : s.currentId;
      return { questions: next, currentId };
    }),
  duplicateQuestions: (ids) =>
    set((s) => {
      const next: Question[] = [];
      for (const q of s.questions) {
        next.push(q);
        if (ids.includes(q.id)) {
          next.push({
            ...q,
            id: uid(),
            items: q.items.map((it) => ({ ...it, id: uid(), data: it.data?.map((r) => r.slice()) })),
            options: q.options.map((o) => ({ ...o, id: uid() })),
          });
        }
      }
      return { questions: next };
    }),
  updateCurrent: (patch) =>
    set((s) => ({
      questions: s.questions.map((q) => (q.id === s.currentId ? { ...q, ...patch } : q)),
    })),
  setOption: (id, patch) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, options: q.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) }
          : q,
      ),
    })),
  reorderOptions: (ids) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, options: ids.map((id) => q.options.find((o) => o.id === id)!).filter(Boolean) }
          : q,
      ),
    })),
  addOption: () =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId ? { ...q, options: [...q.options, { id: uid(), text: "" }] } : q,
      ),
    })),
  removeOption: (id) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId ? { ...q, options: q.options.filter((o) => o.id !== id) } : q,
      ),
    })),
  clearOptions: () =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, options: q.options.map((o) => ({ ...o, text: "", correct: false })) }
          : q,
      ),
    })),
  shuffleOptions: () =>
    set((s) => ({
      questions: s.questions.map((q) => {
        if (q.id !== s.currentId) return q;
        const arr = [...q.options];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return { ...q, options: arr };
      }),
    })),
  autoFillOptions: () => {
    const samples = ["Lorem ipsum", "Dolor sit amet", "Consectetur", "Adipiscing elit", "Sed do eiusmod", "Tempor incididunt"];
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? {
              ...q,
              options: q.options.map((o, i) => ({
                ...o,
                text: samples[i % samples.length],
                correct: i === 0,
              })),
            }
          : q,
      ),
    }));
  },
  toggleFigure: () => {
    const q = get().questions.find((x) => x.id === get().currentId)!;
    get().updateCurrent({ figureOpen: !q.figureOpen });
  },
  cycleCanvasSize: () => {
    const q = get().questions.find((x) => x.id === get().currentId)!;
    const order: CanvasSize[] = ["closed", "half", "full"];
    const next = order[(order.indexOf(q.canvasSize) + 1) % order.length];
    get().updateCurrent({ canvasSize: next, figureOpen: next !== "closed" });
  },
  shrinkCanvas: () => {
    get().updateCurrent({ canvasSize: "closed", figureOpen: false });
  },
  addItem: (kind, label) => {
    const isText = kind === "text";
    const isImage = kind === "image";
    const item: CanvasItem = {
      id: uid(),
      kind,
      x: isText ? 0.15 : 0.25,
      y: isText ? 0.1 : 0.2,
      w: isText ? 0.6 : isImage ? 0.5 : 0.35,
      h: isText ? 0.12 : isImage ? 0.45 : 0.35,
      label: isText ? (label ?? "Text") : label,
    };
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, items: [...q.items, item], figureOpen: true, canvasSize: q.canvasSize === "closed" ? "half" : q.canvasSize }
          : q,
      ),
      selectedItemId: item.id,
      shapePickerOpen: false,
      insertMenuOpen: false,
    }));
  },
  addTable: (rows, cols, mode) => {
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
    const item: CanvasItem = {
      id: uid(),
      kind: mode,
      x: 0.1,
      y: 0.15,
      w: Math.min(0.8, 0.18 * cols + 0.1),
      h: Math.min(0.7, 0.12 * rows + 0.08),
      rows,
      cols,
      data,
    };
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, items: [...q.items, item], figureOpen: true, canvasSize: q.canvasSize === "closed" ? "half" : q.canvasSize }
          : q,
      ),
      selectedItemId: item.id,
      insertMenuOpen: false,
      tableDialog: null,
    }));
  },
  updateItem: (id, patch) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? { ...q, items: q.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }
          : q,
      ),
    })),
  updateItemCell: (id, r, c, value) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId
          ? {
              ...q,
              items: q.items.map((it) => {
                if (it.id !== id || !it.data) return it;
                const data = it.data.map((row) => row.slice());
                data[r][c] = value;
                return { ...it, data };
              }),
            }
          : q,
      ),
    })),
  removeItem: (id) =>
    set((s) => ({
      questions: s.questions.map((q) =>
        q.id === s.currentId ? { ...q, items: q.items.filter((it) => it.id !== id) } : q,
      ),
      selectedItemId: null,
    })),
  selectItem: (id) => set({ selectedItemId: id }),
  setShapePicker: (v) => set({ shapePickerOpen: v }),
  setSolutionOpen: (v) => set({ solutionOpen: v }),
  setLabelPickerOpen: (v) => set({ labelPickerOpen: v }),
  setOptionsSettingsOpen: (v) => set({ optionsSettingsOpen: v }),
  setInsertMenuOpen: (v) => set({ insertMenuOpen: v }),
  setEquationsPickerOpen: (v) => set({ equationsPickerOpen: v }),
  setTableDialog: (v) => set({ tableDialog: v }),
  setLabelStyle: (s) => get().updateCurrent({ labelStyle: s }),
  setTickStyle: (s) => get().updateCurrent({ tickStyle: s }),
  setSolution: (s) => get().updateCurrent({ solution: s }),
}));

export const useCurrentQuestion = () => {
  const id = useMcq((s) => s.currentId);
  return useMcq((s) => s.questions.find((q) => q.id === id)!);
};



