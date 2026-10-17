import { useCallback, useEffect, useRef, useState } from 'react';
import { MOODS, ROWS } from '../moods';

const SPRING = 'cubic-bezier(.32,1.35,.5,1)';
const TILE_OFFSET_X = 66; // tile sits up-left of the pointer…
const TILE_OFFSET_Y = 56; // …overlapping the hovered chip's top edge

// Underdamped springs: x glides with a little overshoot, y is a touch stiffer.
const SPRING_X = { k: 260, c: 24 };
const SPRING_Y = { k: 420, c: 34 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function MoodChips({ glass, reducedMotion }) {
  const [active, setActive] = useState(null);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [pop, setPop] = useState(0);

  const stageRef = useRef(null);
  const tileRef = useRef(null);
  const showRef = useRef(false);
  const pointerInside = useRef(false);
  const popTimer = useRef(0);

  // Spring state lives in a ref and is written straight to the tile, so moving the pointer never re-renders.
  const motion = useRef({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, tilt: 0, snap: true });

  useEffect(() => {
    showRef.current = show;
  }, [show]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const m = motion.current;
      if (m.snap || reducedMotion) {
        m.x = m.tx;
        m.y = m.ty;
        m.vx = m.vy = 0;
        m.snap = false;
      } else {
        m.vx += (SPRING_X.k * (m.tx - m.x) - SPRING_X.c * m.vx) * dt;
        m.vy += (SPRING_Y.k * (m.ty - m.y) - SPRING_Y.c * m.vy) * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
      }
      // Lean into the direction of travel, then settle upright.
      const lean = reducedMotion ? 0 : clamp(m.vx * 0.018, -12, 12);
      m.tilt += (lean - m.tilt) * Math.min(1, dt * 14);
      const el = tileRef.current;
      if (el) {
        el.style.transform = `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0) rotate(${m.tilt.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  useEffect(() => () => clearTimeout(popTimer.current), []);

  /** Client coords → stage coords (the stage may be scaled on small screens). */
  const toStage = useCallback((clientX, clientY) => {
    const stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    const k = r.width / stage.offsetWidth || 1;
    return { x: (clientX - r.left) / k, y: (clientY - r.top) / k };
  }, []);

  const reveal = (i, x, chipTop) => {
    const m = motion.current;
    m.ty = chipTop - TILE_OFFSET_Y;
    if (!showRef.current) {
      m.tx = x - TILE_OFFSET_X;
      m.snap = true; // appear in place instead of sliding in from the last spot
    }
    showRef.current = true;
    setActive(i);
    setShow(true);
  };

  const hide = () => {
    showRef.current = false;
    setShow(false);
  };

  const chipTopOf = (el) => toStage(0, el.getBoundingClientRect().top).y;

  const onChipEnter = (i) => (e) => {
    reveal(i, toStage(e.clientX, e.clientY).x, chipTopOf(e.currentTarget));
  };

  const onChipFocus = (i) => (e) => {
    if (pointerInside.current || !e.currentTarget.matches(':focus-visible')) return;
    const r = e.currentTarget.getBoundingClientRect();
    const centre = toStage(r.left + r.width / 2, 0).x + 28;
    if (showRef.current) motion.current.tx = centre - TILE_OFFSET_X;
    reveal(i, centre, chipTopOf(e.currentTarget));
  };

  const onChipBlur = () => {
    if (!pointerInside.current) hide();
  };

  const onClusterMove = (e) => {
    pointerInside.current = true;
    if (showRef.current) motion.current.tx = toStage(e.clientX, e.clientY).x - TILE_OFFSET_X;
  };

  const onClusterLeave = () => {
    pointerInside.current = false;
    hide();
  };

  const toggle = (i) => () => {
    const turningOn = !selected.has(i);
    setSelected((prev) => {
      const next = new Set(prev);
      if (turningOn) next.add(i);
      else next.delete(i);
      return next;
    });
    setActive(i);
    setPop(turningOn ? 1 : -1);
    clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPop(0), 170);
  };

  const scale = show ? (pop > 0 ? 1.14 : pop < 0 ? 0.9 : 1) : 0.45;

  return (
    <div ref={stageRef} className="relative h-[330px] w-[640px] select-none">
      <p className="absolute inset-x-0 top-0 m-0 text-center text-[15px] font-medium text-(--muted)">
        How are you feeling today?
      </p>

      <div
        onPointerMove={onClusterMove}
        onPointerLeave={onClusterLeave}
        className="absolute inset-x-5 top-[34px] flex flex-col items-center gap-2.5 py-6"
      >
        {ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-2.5">
            {row.map((i) => {
              const on = selected.has(i);
              const hot = show && active === i;
              const v = on ? 'on' : hot ? 'hot' : '';
              const token = (part) => `var(--chip${v ? `-${v}` : ''}-${part})`;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onPointerEnter={onChipEnter(i)}
                  onFocus={onChipFocus(i)}
                  onBlur={onChipBlur}
                  onClick={toggle(i)}
                  className="h-[52px] cursor-pointer rounded-full px-[22px] text-[17px] font-medium tracking-[-0.01em] transition-[background,box-shadow,color] duration-[250ms] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#2f7bea]"
                  style={{ background: token('bg'), boxShadow: token('ring'), color: token('fg') }}
                >
                  <span
                    className="pointer-events-none inline-block"
                    style={{
                      transform: `scale(${hot ? 1.07 : 1})`,
                      transition: reducedMotion ? 'none' : `transform 420ms ${SPRING}`,
                    }}
                  >
                    {MOODS[i].name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Floating preview: position + lean from the spring, appear/pop from CSS. */}
      <div ref={tileRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 size-20 will-change-transform">
        <div
          className="size-full origin-[72%_100%]"
          style={{
            opacity: show ? 1 : 0,
            transform: `scale(${reducedMotion ? (show ? 1 : 0.9) : scale})`,
            // Liquid Glass keeps filter off so the tile's backdrop blur can see the chips beneath.
            filter: glass ? 'none' : `blur(${show ? 0 : 8}px)`,
            transition: show
              ? `opacity 200ms ease, transform 520ms ${SPRING}, filter 260ms ease`
              : 'opacity 160ms ease, transform 260ms ease, filter 180ms ease',
          }}
        >
          <div className="relative size-full rounded-[22px] [background:var(--tile-bg)] [box-shadow:var(--tile-ring)] [backdrop-filter:var(--tile-backdrop)] [-webkit-backdrop-filter:var(--tile-backdrop)]">
            {MOODS.map((m, i) => {
              const on = active === i;
              return (
                <span
                  key={m.name}
                  className="absolute inset-0 flex items-center justify-center font-emoji text-[46px] leading-none"
                  style={{
                    opacity: on ? 1 : 0,
                    filter: `blur(${on ? 0 : 6}px)`,
                    transform: `scale(${on ? 1 : 0.5}) rotate(${on ? 0 : -14}deg)`,
                    transition: reducedMotion
                      ? 'opacity 150ms ease'
                      : `opacity ${on ? 200 : 140}ms ease ${on ? 40 : 0}ms, filter 220ms ease, transform 480ms ${SPRING}`,
                  }}
                >
                  {m.emoji}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
