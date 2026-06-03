import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BD_DISTRICTS } from "@/lib/bd-districts";

const BD_BOUNDS = { minLng: 88.0, maxLng: 92.7, minLat: 20.6, maxLat: 26.65 };

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

    type Firefly = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; phase: number; pulse: number;
    };
    const COUNT = Math.min(
      80,
      Math.max(40, Math.floor((window.innerWidth * window.innerHeight) / 22000)),
    );
    const flies: Firefly[] = [];
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, glow: 0 };
    let lastMoveAt = 0;

    let districtPaths: { path: Path2D; name: string; cx: number; cy: number }[] = [];
    const outlinePath = { p: new Path2D() };

    const projectMap = () => {
      const bw = BD_BOUNDS.maxLng - BD_BOUNDS.minLng;
      const bh = BD_BOUNDS.maxLat - BD_BOUNDS.minLat;
      const scale = Math.min(width / bw, height / bh) * 0.95;
      const ox = (width - bw * scale) / 2 - BD_BOUNDS.minLng * scale;
      const oy = (height + bh * scale) / 2 + BD_BOUNDS.minLat * scale;
      const proj = (lng: number, lat: number): [number, number] => [
        lng * scale + ox,
        -lat * scale + oy,
      ];
      districtPaths = BD_DISTRICTS.map((d) => {
        const path = new Path2D();
        d.p.forEach(([lng, lat], i) => {
          const [x, y] = proj(lng, lat);
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        });
        path.closePath();
        const [cx, cy] = proj(d.cx, d.cy);
        return { path, name: d.n, cx, cy };
      });
      const all = new Path2D();
      districtPaths.forEach((d) => all.addPath(d.path));
      outlinePath.p = all;
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
      flies.length = 0;
      for (let i = 0; i < COUNT; i++) {
        flies.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.1 + 0.4,
          phase: Math.random() * Math.PI * 2,
          pulse: 0.4 + Math.random() * 1.2,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      lastMoveAt = performance.now();
    };
    const onLeave = () => { lastMoveAt = 0; };

    resize();
    seed();

    if (reduced) {
      ctx.strokeStyle = "rgba(180, 140, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke(outlinePath.p);
      ctx.fillStyle = "rgba(255,230,170,0.5)";
      for (const n of flies) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const onResize = () => { resize(); seed(); };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    const SPOT_R = 210;
    let raf = 0;
    const t0 = performance.now();

    const tick = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;

      ctx.clearRect(0, 0, width, height);

      // Ease cursor
      if (mouse.tx > -1000) {
        mouse.x += (mouse.tx - mouse.x) * 0.18;
        mouse.y += (mouse.ty - mouse.y) * 0.18;
      }
      // Glow fades in on movement, dims out when still
      const sinceMove = now - lastMoveAt;
      const target = lastMoveAt && sinceMove < 350 ? 1 : 0;
      mouse.glow += (target - mouse.glow) * (target > mouse.glow ? 0.08 : 0.025);
      const glow = mouse.glow;

      // Soft spotlight reveal — no hard circular clip; falloff per-district
      if (glow > 0.01 && mouse.x > -1000) {
        // ambient warm wash
        const grad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0, mouse.x, mouse.y, SPOT_R * 1.3,
        );
        grad.addColorStop(0, `rgba(180,120,255,${0.16 * glow})`);
        grad.addColorStop(0.5, `rgba(150,100,230,${0.06 * glow})`);
        grad.addColorStop(1, "rgba(150,100,230,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (const d of districtPaths) {
          const dx = d.cx - mouse.x;
          const dy = d.cy - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const k = Math.max(0, 1 - dist / (SPOT_R * 1.25));
          const a = k * k * glow;
          if (a < 0.02) continue;
          ctx.fillStyle = `rgba(192,132,252,${0.09 * a})`;
          ctx.fill(d.path);
          ctx.strokeStyle = `rgba(216,180,254,${0.8 * a})`;
          ctx.lineWidth = 1;
          ctx.stroke(d.path);
          if (a > 0.45) {
            ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(240,225,255,${0.9 * (a - 0.3)})`;
            ctx.fillText(d.name.toUpperCase(), d.cx, d.cy);
          }
        }
      }

      // Fireflies — drift independently, never react to cursor
      for (const n of flies) {
        n.x += n.vx;
        n.y += n.vy;
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;
        const sp = Math.hypot(n.vx, n.vy);
        const max = 0.45;
        if (sp > max) { n.vx = (n.vx / sp) * max; n.vy = (n.vy / sp) * max; }
        if (n.x < -10) n.x = width + 10;
        if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        if (n.y > height + 10) n.y = -10;

        const tw = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * n.pulse + n.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 225, 160, ${tw * 0.5})`;
        ctx.shadowColor = "rgba(255, 200, 110, 0.55)";
        ctx.shadowBlur = 5;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
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

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 md:px-12 md:py-8">
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/60">
          <Link to="/" className="flex items-center gap-2 text-white/90 transition hover:text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
            canvas.craft
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/projects" className="transition hover:text-white">projects</Link>
            <Link to="/login" className="transition hover:text-white">sign in</Link>
          </nav>
        </header>

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
              <span className="block italic font-light text-white/55">take shape.</span>
            </h1>
            <p
              className="animate-fade-in mt-8 max-w-md text-base text-white/65 md:text-lg"
              style={{ animationDelay: "360ms", animationFillMode: "both" }}
            >
              A quiet workspace for building curricula, slides and ideas — together.
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
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link to="/projects" className="text-sm uppercase tracking-[0.3em] text-white/60 transition hover:text-white">
                browse projects
              </Link>
            </div>
          </div>
        </main>

        <footer className="flex items-end justify-between text-[0.65rem] uppercase tracking-[0.35em] text-white/40">
          <span>move cursor · reveal bangladesh</span>
          <span>v0.1 · est. 2026</span>
        </footer>
      </div>
    </div>
  );
}
