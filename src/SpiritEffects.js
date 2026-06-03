// PROFI-CY · SpiritEffects.js
import { useEffect, useRef, useCallback } from "react";

function makeCanvas(container) {
  const c = document.createElement("canvas");
  c.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
  container.style.position = "relative";
  container.insertBefore(c, container.firstChild);
  return c;
}

function runParticles(canvas) {
  const ctx = canvas.getContext("2d");
  let W, H, particles = [], raf;
  const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const rand = (a, b) => a + Math.random() * (b - a);
  const spawn = () => ({ x:rand(0,W), y:H+rand(0,20), r:rand(1.5,4), speed:rand(0.25,0.7), drift:rand(-0.3,0.3), alpha:rand(0.3,0.7), life:1, decay:rand(0.002,0.006) });
  for (let i = 0; i < 22; i++) { const p = spawn(); p.y = rand(0,H); particles.push(p); }
  const draw = () => {
    ctx.clearRect(0,0,W,H);
    if (particles.length < 22) particles.push(spawn());
    particles.forEach((p,i) => {
      p.y -= p.speed; p.x += p.drift; p.life -= p.decay;
      if (p.life <= 0 || p.y < -10) { particles[i] = spawn(); return; }
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.5);
      g.addColorStop(0,`rgba(232,184,75,${p.alpha*p.life})`);
      g.addColorStop(1,`rgba(232,184,75,0)`);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

function runFlames(canvas) {
  const ctx = canvas.getContext("2d");
  let W, H, flames = [], raf;
  const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const rand = (a, b) => a + Math.random() * (b - a);
  const spawnFlame = () => ({ x:rand(0,W), y:H, height:0, maxH:rand(40,110), width:rand(2,5), speed:rand(0.4,1.0), sway:rand(-0.4,0.4), swayDir:Math.random()>0.5?1:-1, alpha:rand(0.25,0.55), life:1, decay:rand(0.003,0.008) });
  for (let i = 0; i < 18; i++) { const f = spawnFlame(); f.height = rand(0,f.maxH); f.life = rand(0.2,1); flames.push(f); }
  const draw = () => {
    ctx.clearRect(0,0,W,H);
    flames.forEach((f,i) => {
      f.height += f.speed; f.x += f.sway*f.swayDir*0.3; f.life -= f.decay;
      if (f.life <= 0 || f.height > f.maxH) { flames[i] = spawnFlame(); return; }
      const base = H-5, tip = base-f.height;
      const g = ctx.createLinearGradient(f.x,base,f.x,tip);
      g.addColorStop(0,`rgba(232,184,75,${f.alpha*f.life})`);
      g.addColorStop(0.4,`rgba(242,210,120,${f.alpha*f.life*0.7})`);
      g.addColorStop(1,`rgba(255,240,180,0)`);
      ctx.beginPath();
      ctx.moveTo(f.x-f.width,base);
      ctx.quadraticCurveTo(f.x+f.sway*f.swayDir*8, base-f.height*0.6, f.x, tip);
      ctx.quadraticCurveTo(f.x-f.sway*f.swayDir*8, base-f.height*0.6, f.x+f.width, base);
      ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

function runWind(canvas) {
  const ctx = canvas.getContext("2d");
  let W, H, lines = [], raf;
  const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const rand = (a, b) => a + Math.random() * (b - a);
  const ANGLE = -10 * Math.PI / 180;
  const spawnLine = () => ({ x:-rand(80,200), y:rand(0,H), len:rand(60,160), speed:rand(0.5,1.0)*0.7, alpha:rand(0.08,0.28), width:rand(0.4,1.2) });
  for (let i = 0; i < 16; i++) { const l = spawnLine(); l.x = rand(-200,W+200); lines.push(l); }
  const draw = () => {
    ctx.clearRect(0,0,W,H);
    lines.forEach((l,i) => {
      l.x += l.speed;
      if (l.x > W+220) { lines[i] = spawnLine(); return; }
      ctx.save(); ctx.translate(l.x,l.y); ctx.rotate(ANGLE);
      const g = ctx.createLinearGradient(0,0,l.len,0);
      g.addColorStop(0,`rgba(232,184,75,0)`);
      g.addColorStop(0.3,`rgba(232,184,75,${l.alpha})`);
      g.addColorStop(0.7,`rgba(242,210,130,${l.alpha})`);
      g.addColorStop(1,`rgba(232,184,75,0)`);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(l.len,0);
      ctx.strokeStyle=g; ctx.lineWidth=l.width; ctx.stroke(); ctx.restore();
    });
    raf = requestAnimationFrame(draw);
  };
  draw();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}

function burstPentecost(x, y) {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const RINGS = 4, MAX_R = 130, ALPHA = 0.47, DURATION = 900, LW = 0.9, GAP = 35;
  const rings = Array.from({length:RINGS},(_,i) => ({
    r: 0,
    maxR: MAX_R * (0.35 + i * (0.65 / Math.max(RINGS-1,1))),
    alpha: ALPHA * (1 - i * 0.12),
    delay: i * (DURATION * 0.08),
    lw: LW * (1 - i * 0.08),
  }));
  const cx = x, cy = y;
  let start = null;
  const draw = (now) => {
    if (!start) start = now;
    const elapsed = now - start;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    rings.forEach(ring => {
      const t = elapsed - ring.delay;
      if (t < 0) { alive = true; return; }
      const progress = t / DURATION;
      if (progress >= 1) return;
      alive = true;
      ring.r = ring.maxR * Math.pow(progress, 0.55);
      const alpha = ring.alpha * (1 - progress);
      ctx.beginPath(); ctx.arc(cx,cy,ring.r,0,Math.PI*2);
      ctx.strokeStyle = `rgba(232,184,75,${alpha})`;
      ctx.lineWidth = ring.lw; ctx.stroke();
    });
    if (alive) requestAnimationFrame(draw); else canvas.remove();
  };
  requestAnimationFrame(draw);
}

const FIRE_TABS = new Set(["profecias","quiz"]);

export default function SpiritEffects({ tab }) {
  const cleanupsRef = useRef([]);

  const initEffects = useCallback(() => {
    cleanupsRef.current.forEach(fn => fn());
    cleanupsRef.current = [];
    document.querySelectorAll(".spirit-canvas").forEach(c => c.remove());

    const colIndex = document.querySelector(".col-index");
    if (colIndex && colIndex.offsetWidth > 0) {
      const cv = makeCanvas(colIndex); cv.classList.add("spirit-canvas");
      cleanupsRef.current.push(runParticles(cv));
    }
    const colTools = document.querySelector(".col-tools");
    if (colTools && colTools.offsetWidth > 0) {
      const cv = makeCanvas(colTools); cv.classList.add("spirit-canvas");
      cleanupsRef.current.push(runParticles(cv));
    }
    const colMain = document.querySelector(".col-main");
    if (colMain) {
      const cv = makeCanvas(colMain); cv.classList.add("spirit-canvas");
      if (FIRE_TABS.has(tab)) cleanupsRef.current.push(runFlames(cv));
      else cleanupsRef.current.push(runWind(cv));

      const onClick = (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (["button","input","select","textarea","a"].includes(tag)) return;
        burstPentecost(e.clientX, e.clientY);
      };
      colMain.addEventListener("click", onClick);
      cleanupsRef.current.push(() => colMain.removeEventListener("click", onClick));
    }
  }, [tab]);

  useEffect(() => {
    const t = setTimeout(initEffects, 80);
    return () => {
      clearTimeout(t);
      cleanupsRef.current.forEach(fn => fn());
      cleanupsRef.current = [];
      document.querySelectorAll(".spirit-canvas").forEach(c => c.remove());
    };
  }, [initEffects]);

  useEffect(() => {
    const onResize = () => initEffects();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initEffects]);

  return null;
}
