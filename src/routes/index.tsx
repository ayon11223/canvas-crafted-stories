import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import bdPolygon from "@/lib/bd-polygon.json";

const BD_BOUNDS = { minLng: 88.0, maxLng: 92.7, minLat: 20.6, maxLat: 26.65 };
const DIVISIONS: { name: string; lng: number; lat: number }[] = [
  { name: "Dhaka", lng: 90.41, lat: 23.81 },
  { name: "Chattogram", lng: 91.78, lat: 22.36 },
  { name: "Khulna", lng: 89.57, lat: 22.84 },
  { name: "Rajshahi", lng: 88.6, lat: 24.37 },
  { name: "Sylhet", lng: 91.87, lat: 24.9 },
  { name: "Barishal", lng: 90.37, lat: 22.7 },
  { name: "Rangpur", lng: 89.25, lat: 25.74 },
  { name: "Mymensingh", lng: 90.42, lat: 24.75 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "canvas.craft — a quiet workspace for teaching" },
      {
        name: "description",
        content:
          "A quiet workspace for building curricula, slides and ideas — together.",
      },
      { property: "og:title", content: "canvas.craft" },
      {
        property: "og:description",
        content:
          "A quiet workspace for building curricula, slides and ideas — together.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function NodeField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    const NODE_COUNT = Math.min(
      140,
      Math.max(60, Math.floor((window.innerWidth * window.innerHeight) / 14000)),
    );
    const nodes: Node[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    // Map projection state — recomputed on resize
    let mapPath = new Path2D();
    let divisionsScreen: { name: string; x: number; y: number }[] = [];
    const projectMap = () => {
      // Fit Bangladesh bounds into ~85% of the smaller viewport dim, centered
      const bw = BD_BOUNDS.maxLng - BD_BOUNDS.minLng;
      const bh = BD_BOUNDS.maxLat - BD_BOUNDS.minLat;
      const scale = Math.min(width / bw, height / bh) * 0.92;
      const ox = (width - bw * scale) / 2 - BD_BOUNDS.minLng * scale;
      const oy = (height + bh * scale) / 2 + BD_BOUNDS.minLat * scale;
      const proj = (lng: number, lat: number): [number, number] => [
        lng * scale + ox,
        -lat * scale + oy, // flip y
      ];
      mapPath = new Path2D();
      const pts = bdPolygon as [number, number][];
      pts.forEach(([lng, lat], i) => {
        const [x, y] = proj(lng, lat);
        if (i === 0) mapPath.moveTo(x, y);
        else mapPath.lineTo(x, y);
      });
      mapPath.closePath();
      divisionsScreen = DIVISIONS.map((d) => {
        const [x, y] = proj(d.lng, d.lat);
        return { name: d.name, x, y };
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      projectMap();
    };

    const seed = () => {
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.3 + 0.4,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    seed();

    if (reduced) {
      // Static: faint map + starfield
      ctx.strokeStyle = "rgba(180, 140, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke(mapPath);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    window.addEventListener("resize", () => {
      resize();
      seed();
    });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    const LINK_DIST = 130;
    const SPOT_R = 170;
    let raf = 0;

    const tick = () => {
      // Trail fade — leaves a soft motion blur
      ctx.fillStyle = "rgba(6, 7, 13, 0.35)";
      ctx.fillRect(0, 0, width, height);

      // Faint always-on map outline (barely visible — hidden beneath the dark)
      ctx.save();
      ctx.strokeStyle = "rgba(140, 110, 200, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke(mapPath);
      ctx.restore();

      // Spotlight reveal — bright purple map fragment under cursor
      if (mouse.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, SPOT_R, 0, Math.PI * 2);
        ctx.clip();

        // Glow wash inside spotlight
        const grad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, SPOT_R,
        );
        grad.addColorStop(0, "rgba(168, 85, 247, 0.22)");
        grad.addColorStop(0.6, "rgba(139, 92, 246, 0.10)");
        grad.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Filled land tint
        ctx.fillStyle = "rgba(192, 132, 252, 0.10)";
        ctx.fill(mapPath);
        // Bright outline
        ctx.strokeStyle = "rgba(216, 180, 254, 0.95)";
        ctx.lineWidth = 1.2;
        ctx.stroke(mapPath);

        // Division markers + labels (inside spotlight only)
        ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
        ctx.textBaseline = "middle";
        for (const d of divisionsScreen) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > SPOT_R) continue;
          const alpha = 1 - dist / SPOT_R;
          ctx.beginPath();
          ctx.fillStyle = `rgba(232, 200, 255, ${0.9 * alpha})`;
          ctx.arc(d.x, d.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(240, 220, 255, ${0.95 * alpha})`;
          ctx.fillText(d.name.toUpperCase(), d.x + 6, d.y);
        }
        ctx.restore();
      }

      // Update + draw nodes
      for (const n of nodes) {
        // Magnet toward cursor
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 200 * 200 && d2 > 1) {
            const f = 0.04 / Math.sqrt(d2);
            n.vx += dx * f;
            n.vy += dy * f;
          }
        }

        n.x += n.vx;
        n.y += n.vy;
        // friction
        n.vx *= 0.985;
        n.vy *= 0.985;
        // baseline drift so they never fully stop
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.04;
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.04;

        // wrap
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;

        // Star color: bright purple near cursor, soft white otherwise
        let lit = 0;
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < SPOT_R) lit = 1 - d / SPOT_R;
        }
        if (lit > 0) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(196, 130, 255, ${0.4 + 0.6 * lit})`;
          ctx.shadowColor = "rgba(168, 85, 247, 0.9)";
          ctx.shadowBlur = 10 * lit;
          ctx.arc(n.x, n.y, n.r + lit * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.fillStyle = "rgba(220, 220, 255, 0.55)";
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Connect nodes near cursor
      if (mouse.active) {
        for (const n of nodes) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const a = (1 - d / LINK_DIST) * 0.6;
            ctx.strokeStyle = `rgba(196, 130, 255, ${a})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
        // Connect nodes to each other near cursor
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          const dxm = a.x - mouse.x;
          const dym = a.y - mouse.y;
          if (dxm * dxm + dym * dym > 220 * 220) continue;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < LINK_DIST * LINK_DIST) {
              const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.25;
              ctx.strokeStyle = `rgba(216, 180, 254, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

function Index() {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 70% 110%, #1a1228 0%, #0a0a14 45%, #06070d 100%)",
      }}
    >
      <NodeField />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 md:px-12 md:py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/60">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/90 transition hover:text-white"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
            canvas.craft
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/projects"
              className="transition hover:text-white"
            >
              projects
            </Link>
            <Link to="/login" className="transition hover:text-white">
              sign in
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <main className="flex flex-1 items-center">
          <div className="max-w-3xl">
            <p
              className="animate-fade-in text-[0.7rem] uppercase tracking-[0.45em] text-white/50"
              style={{ animationDelay: "60ms", animationFillMode: "both" }}
            >
              ─── a teaching canvas
            </p>

            <h1
              className="animate-fade-in mt-6 font-semibold leading-[0.95] tracking-tight"
              style={{
                fontSize: "clamp(2.75rem, 8vw, 7rem)",
                animationDelay: "180ms",
                animationFillMode: "both",
              }}
            >
              <span className="block text-white">Where lessons</span>
              <span className="block italic font-light text-white/55">
                take shape.
              </span>
            </h1>

            <p
              className="animate-fade-in mt-8 max-w-md text-base text-white/65 md:text-lg"
              style={{ animationDelay: "360ms", animationFillMode: "both" }}
            >
              A quiet workspace for building curricula, slides and ideas —
              together.
            </p>

            <div
              className="animate-fade-in mt-10 flex flex-wrap items-center gap-6"
              style={{ animationDelay: "520ms", animationFillMode: "both" }}
            >
              <Link
                to="/projects"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Open a canvas
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              <Link
                to="/projects"
                className="text-sm uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
              >
                browse projects
              </Link>
            </div>
          </div>
        </main>

        {/* Footer meta */}
        <footer className="flex items-end justify-between text-[0.65rem] uppercase tracking-[0.35em] text-white/40">
          <span>move cursor · the field responds</span>
          <span>v0.1 · est. 2026</span>
        </footer>
      </div>
    </div>
  );
}
