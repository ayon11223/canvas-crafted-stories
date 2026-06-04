import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/mcq/TopBar";
import { QuestionCanvas } from "@/components/mcq/QuestionCanvas";
import { OptionsList } from "@/components/mcq/OptionsList";
import { SolutionPanel } from "@/components/mcq/SolutionPanel";
import { SlideStrip } from "@/components/mcq/SlideStrip";
import { BottomToolbar } from "@/components/mcq/BottomToolbar";
import { ShapePicker } from "@/components/mcq/ShapePicker";
import { LabelPicker } from "@/components/mcq/LabelPicker";
import { OptionsSettings } from "@/components/mcq/OptionsSettings";
import { InsertMenu } from "@/components/mcq/InsertMenu";
import { TableDialog } from "@/components/mcq/TableDialog";
import { EquationsPicker } from "@/components/mcq/EquationsPicker";
import { SlideGrid } from "@/components/mcq/SlideGrid";
import { useMcq } from "@/lib/mcq-store";
import { installLastFocusTracker } from "@/lib/last-focus";

export const Route = createFileRoute("/_authenticated/editor")({
  component: Editor,
});

function Editor() {
  const { questions, currentId, setCurrent } = useMcq();
  const [direction, setDirection] = useState(0);
  const prevId = useRef(currentId);
  const start = useRef<{ x: number; y: number; t: number; blocked: boolean; locked: "h" | "v" | null } | null>(null);

  useEffect(() => {
    installLastFocusTracker();
  }, []);

  useEffect(() => {
    if (prevId.current === currentId) return;
    const prevIdx = questions.findIndex((q) => q.id === prevId.current);
    const nextIdx = questions.findIndex((q) => q.id === currentId);
    setDirection(nextIdx > prevIdx ? 1 : -1);
    prevId.current = currentId;
  }, [currentId, questions]);

  const isBlocked = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest(
      "input, textarea, select, button, [contenteditable='true'], [data-canvas-item], [data-no-swipe]",
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now(), blocked: isBlocked(e.target), locked: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current;
    if (!s || s.blocked) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (!s.locked && Math.abs(dx) + Math.abs(dy) > 12) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (s.locked === "v") start.current = null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || s.blocked || s.locked !== "h") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dt = Date.now() - s.t;
    if (Math.abs(dx) < 60 || dt > 800) return;
    const idx = questions.findIndex((q) => q.id === currentId);
    const next = dx < 0 ? idx + 1 : idx - 1;
    if (next >= 0 && next < questions.length) {
      setDirection(dx < 0 ? 1 : -1);
      setCurrent(questions[next].id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar />
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pb-2 relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentId}
            custom={direction}
            initial={{ x: direction === 0 ? 0 : direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: "tween", duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <QuestionCanvas />
            <OptionsList />
            <SolutionPanel />
          </motion.div>
        </AnimatePresence>
      </main>
      <SlideStrip />
      <BottomToolbar />
      <ShapePicker />
      <LabelPicker />
      <OptionsSettings />
      <InsertMenu />
      <TableDialog />
      <EquationsPicker />
      <SlideGrid />
    </div>
  );
}