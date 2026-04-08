import { animate, createTimeline, cubicBezier } from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

export function playHomeIntro({ lenis = null, isHome = false } = {}) {
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
            0.875;

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
        animate(".intro_circle", {
          opacity: 0.2,
          duration: 250,
        });
        resolve();
        return;
      }

      animate(".intro_center, .intro_btm, .inter", {
        opacity: 0,
        duration: 250,
        ease: cubicEase,
      }).then(() => {
        introEl.style.zIndex = "-1";
        document.body.style.overflow = "";
        if (lenis) lenis.start();
        resolve();
      });
    });
  });
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
      translateY: config.flowerY,
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
