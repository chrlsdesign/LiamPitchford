import {
  animate,
  createAnimatable,
  createTimeline,
  cubicBezier,
} from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

let introInterAc = null;

export function playHomeIntro({ lenis = null, isHome = false } = {}) {
  if (introInterAc) {
    introInterAc.abort();
    introInterAc = null;
  }

  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  return new Promise((resolve) => {
    const tl = createTimeline({
      defaults: { duration: 700, ease: cubicEase },
    });

    tl.add(
      ".intro_title",
      {
        translateX: (el, i) => (i === 0 ? ["100%", "0%"] : ["-100%", "0%"]),
        duration: 500,
        delay: 250,
      },
      0,
    ).add(
      ".intro_center",
      {
        translateX: (el, i) => {
          const rect = el.getBoundingClientRect();
          const padding =
            parseFloat(getComputedStyle(document.documentElement).fontSize) *
            1.25;

          if (i === 0) {
            return -(rect.left - padding);
          }
          return window.innerWidth - rect.right - padding;
        },
      },
      750,
    );

    tl.then(() => {
      if (isHome) {
        document.body.style.overflow = "";
        if (lenis) lenis.start();
        animate(".main", { opacity: 1, pointerEvents: "auto", duration: 0 });

        const ac = new AbortController();
        introInterAc = ac;
        const inter = document.querySelector(".inter");
        if (inter) {
          animate(inter, { opacity: 1, pointerEvents: "auto", duration: 0 });
          const animatable = createAnimatable(inter, {
            x: { duration: 600, ease: "out(3)" },
            y: { duration: 600, ease: "out(3)" },
          });
          document.addEventListener(
            "mousemove",
            (e) => {
              animatable.x(e.clientX - inter.offsetWidth / 2);
              animatable.y(e.clientY - inter.offsetHeight / 2);
            },
            { signal: ac.signal },
          );
        }

        resolve();
        return;
      }

      // Non-home: enable .inter mousemove, wait for scroll to dismiss
      const ac = new AbortController();
      introInterAc = ac;

      const inter = document.querySelector(".inter");
      if (inter) {
        const animatable = createAnimatable(inter, {
          x: { duration: 600, ease: "out(3)" },
          y: { duration: 600, ease: "out(3)" },
        });
        document.addEventListener(
          "mousemove",
          (e) => {
            animate(inter, { opacity: 1, duration: 250 });
            animatable.x(e.clientX - inter.offsetWidth / 2);
            animatable.y(e.clientY - inter.offsetHeight / 2);
          },
          { signal: ac.signal },
        );
      }

      document.body.style.overflow = "";

      const dismiss = () => {
        ac.abort();
        introInterAc = null;
        animate(".intro_center, .intro_btm, .inter", {
          opacity: 0,
          duration: 250,
          ease: cubicEase,
        }).then(() => {
          animate(".main", {
            opacity: 1,
            pointerEvents: "auto",
            duration: 400,
            ease: cubicEase,
          });
          animate(".nav", {
            y: "0%",
            duration: 400,
            ease: cubicEase,
          });
          if (lenis) lenis.start();
          resolve();
        });
      };

      window.addEventListener("wheel", dismiss, {
        once: true,
        signal: ac.signal,
      });
      window.addEventListener("touchmove", dismiss, {
        once: true,
        signal: ac.signal,
      });
    });
  });
}

/** Stop homepage `.inter` mousemove (call from home.js onLeaveForward). */
export function detachIntroInterListeners() {
  if (introInterAc) {
    introInterAc.abort();
    introInterAc = null;
  }
}

/** @param {{ lenis?: object | null, isHome?: boolean }} [opts] */
export function playSharedIntroIfPresent(opts) {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro(opts);
}

const DEFAULT_FLOWER_Y = "50%";

const INTRO_PAGE_CONFIG = {
  home: { opacity: 1, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
  about: { opacity: 1, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
  work: { opacity: 1, flowerY: "-50%", fill: "#ffffff" },
  workContent: { opacity: 0, flowerY: "-50%", fill: "#EE7F31" },
};

let defaultFill = null;

function parseFlowerYPercent(value) {
  const m = String(value).match(/^(-?[\d.]+)%$/);
  return m ? parseFloat(m[1]) : null;
}

/** Current translateY as % of element height (CSS % resolves against self). */
function readFlowerTranslateYPercent(el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  const h = el.getBoundingClientRect().height || 1;
  return (m.m42 / h) * 100;
}

function flowerYNeedsAnimation(el, targetY) {
  const target = parseFlowerYPercent(targetY);
  if (target == null) return true;
  const current = readFlowerTranslateYPercent(el);
  return Math.abs(current - target) > 0.75;
}

export function updateIntroForPage(page) {
  const introEl = document.querySelector(".intro");
  if (!introEl) return;

  const config = INTRO_PAGE_CONFIG[page];
  if (!config) return;

  const flowerGroup = introEl.querySelector(".flower_group");
  const paths = introEl.querySelectorAll(".flower_group .front");

  if (defaultFill === null && paths.length) {
    defaultFill = getComputedStyle(paths[0]).fill;
  }

  animate(introEl, {
    opacity: config.opacity,
    duration: 400,
    ease: cubicEase,
  });

  if (flowerGroup && flowerYNeedsAnimation(flowerGroup, config.flowerY)) {
    animate(flowerGroup, {
      y: config.flowerY,
      duration: 1500,
      ease: cubicEase,
    });
  }

  if (paths.length) {
    animate(paths, {
      fill: { to: config.fill || defaultFill },
      duration: 400,
      ease: cubicEase,
    });
  }
}
