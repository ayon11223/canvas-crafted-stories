import { useMcq, type CanvasItem, type SlotNode, type EquationTemplate } from "@/lib/mcq-store";
import { EditableSlot } from "./EditableSlot";

interface Props {
  itemId: string;
  // Either provide a top-level item (with template + slots), or a nested node.
  item?: CanvasItem;
  node?: SlotNode;
}

/**
 * Renders the static math glyphs (fraction bar, radical, etc.) inline
 * with EditableSlots for the user-fillable holes. Uses CSS instead of
 * KaTeX rendering for the editable templates so contenteditable holes
 * stay native and reliable on mobile. KaTeX is still available for
 * future read-only typeset output.
 */
export function Equation({ itemId, item, node }: Props) {
  const template = (item?.template ?? node?.template) as EquationTemplate | undefined;
  const slots = item?.slots ?? node?.slots ?? {};
  const nodeId = node?.id ?? null;
  if (!template) return null;

  const renderSlot = (key: string, placeholder: string) => {
    const children = slots[key] ?? [];
    const firstText = children.find((c) => c.kind === "text");
    const rest = children.filter((c) => c.kind !== "text");
    return (
      <EditableSlot
        itemId={itemId}
        nodeId={nodeId}
        slotKey={key}
        value={firstText?.value ?? ""}
        children={rest}
        placeholder={placeholder}
      />
    );
  };

  switch (template) {
    case "fraction":
      return (
        <span className="inline-flex flex-col items-center align-middle font-serif italic text-current leading-none mx-0.5">
          <span className="px-1 text-[0.9em]">{renderSlot("num", "a")}</span>
          <span className="border-t border-current w-full my-0.5" />
          <span className="px-1 text-[0.9em]">{renderSlot("den", "b")}</span>
        </span>
      );
    case "sqrt":
      return (
        <span className="inline-flex items-center font-serif italic mx-0.5">
          <span className="text-[1.4em] leading-none">√</span>
          <span className="border-t border-current pt-0.5 px-1">{renderSlot("rad", "x")}</span>
        </span>
      );
    case "nthroot":
      return (
        <span className="inline-flex items-end font-serif italic mx-0.5">
          <span className="text-[0.65em] -mr-1 mb-2">{renderSlot("idx", "n")}</span>
          <span className="text-[1.4em] leading-none">√</span>
          <span className="border-t border-current pt-0.5 px-1">{renderSlot("rad", "x")}</span>
        </span>
      );
    case "power":
      return (
        <span className="inline-flex items-start font-serif italic mx-0.5">
          <span>{renderSlot("base", "x")}</span>
          <span className="text-[0.7em] -mt-1">{renderSlot("exp", "n")}</span>
        </span>
      );
    case "derivative":
      return (
        <span className="inline-flex items-center font-serif italic mx-0.5">
          <span className="inline-flex flex-col items-center leading-none">
            <span className="px-1 text-[0.9em]">d{renderSlot("expr", "y")}</span>
            <span className="border-t border-current w-full my-0.5" />
            <span className="px-1 text-[0.9em]">d{renderSlot("wrt", "x")}</span>
          </span>
        </span>
      );
  }
}

export function useEquationActions() {
  const { activeSlot, insertSlotNode, addSmartEquation } = useMcq();
  return (template: EquationTemplate) => {
    if (activeSlot) {
      const id = Math.random().toString(36).slice(2, 9);
      insertSlotNode(activeSlot, {
        id,
        kind: "smart-equation",
        template,
        slots: defaultSlotsFor(template),
      });
    } else {
      addSmartEquation(template);
    }
  };
}

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