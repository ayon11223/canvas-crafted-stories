import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  FolderOpen,
  ScanLine,
  Plus,
  FunctionSquare,
  Type,
  Sparkles,
  Eye,
  Layers,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useMcq } from "@/lib/mcq-store";

type Item = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
};

export function BottomToolbar() {
  const {
    setInsertMenuOpen,
    setSolutionOpen,
    solutionOpen,
    setEquationsPickerOpen,
    addItem,
    setOptionsSettingsOpen,
  } = useMcq();

  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
  });
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setPage(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const stub = (name: string) => () =>
    toast(`${name}`, { description: "Coming soon" });

  const pageOne: Item[] = [
    { icon: FolderOpen, label: "Library", onClick: stub("Library") },
    { icon: Plus, label: "Insert", onClick: () => setInsertMenuOpen(true) },
    { icon: FunctionSquare, label: "Equations", onClick: () => setEquationsPickerOpen(true) },
    { icon: Type, label: "Text Box", onClick: () => addItem("text", "") },
    { icon: Sparkles, label: "AI", onClick: () => setSolutionOpen(!solutionOpen) },
  ];

  const pageTwo: Item[] = [
    { icon: ScanLine, label: "Scanner", onClick: stub("Scanner") },
    { icon: Eye, label: "Preview", onClick: stub("Preview") },
    { icon: Layers, label: "Layers", onClick: stub("Layers") },
    { icon: Settings2, label: "Choices", onClick: () => setOptionsSettingsOpen(true) },
    { icon: SlidersHorizontal, label: "Project", onClick: stub("Project Settings") },
  ];

  return (
    <div className="bg-toolbar border-t border-black/40 pb-[env(safe-area-inset-bottom)]" data-no-swipe>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          <ToolbarPage items={pageOne} />
          <ToolbarPage items={pageTwo} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 pb-1">
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => embla?.scrollTo(i)}
            aria-label={`Toolbar page ${i + 1}`}
            className={`h-1 rounded-full transition-all ${
              page === i ? "w-4 bg-foreground/80" : "w-1 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ToolbarPage({ items }: { items: Item[] }) {
  return (
    <div className="flex-[0_0_100%] min-w-0">
      <div className="flex items-end justify-around px-2 py-2">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={it.onClick}
            className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground py-1 px-1"
            aria-label={it.label}
          >
            <it.icon className="size-5" strokeWidth={1.5} />
            <span className="text-[9px] font-medium uppercase tracking-wider">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}



