import { Plus, Sparkles, Minus } from "lucide-react";
import { useCurrentQuestion, useMcq } from "@/lib/mcq-store";
import { motion, AnimatePresence } from "framer-motion";

export function SolutionPanel() {
  const q = useCurrentQuestion();
  const { setSolutionOpen, solutionOpen, setSolution } = useMcq();

  return (
    <div className="px-4 mt-3 space-y-3">


      <button
        onClick={() => setSolutionOpen(!solutionOpen)}
        className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl border-2 border-dashed transition ${
          solutionOpen
            ? "border-primary/60 bg-card text-foreground"
            : "border-border hover:border-primary/60 hover:bg-card"
        }`}
      >
        {solutionOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
        {solutionOpen ? "Hide Solution" : "Add Solution / Explanation"}
      </button>

      <AnimatePresence>
        {solutionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-card border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Solution</span>
                <button
                  onClick={() =>
                    setSolution(
                      (q.solution ? q.solution + "\n\n" : "") +
                        "✦ AI: The correct option is derived by ...",
                    )
                  }
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Sparkles className="size-3" /> Generate with AI
                </button>
              </div>
              <textarea
                value={q.solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Write the step-by-step solution, or tap Generate with AI..."
                rows={4}
                className="w-full bg-background/40 rounded-lg p-2 text-sm outline-none resize-none placeholder:text-muted-foreground/60"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



