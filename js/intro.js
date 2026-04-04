import {
  animate,
  createAnimatable,
  createTimeline,
  cubicBezier,
} from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

export function playHomeIntro({ lenis = null } = {}) {
  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  const circle = document.querySelector(".inter");

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
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();

      const ac = new AbortController();
      const { signal } = ac;

      if (circle) {
        const animatable = createAnimatable(circle, {
          x: { duration: 800, ease: "out(3)" },
          y: { duration: 800, ease: "out(3)" },
        });

        let bounds = introEl.getBoundingClientRect();
        window.addEventListener(
          "resize",
          () => (bounds = introEl.getBoundingClientRect()),
          { signal },
        );

        document.body.addEventListener(
          "mousemove",
          (e) => {
            animate(circle, {
              opacity: 1,
              duration: 500,
              ease: cubicEase,
            });

            const { width, height, left, top } = bounds;
            const x = e.clientX - left - width / 2;
            const y = e.clientY - top - height / 2;
            animatable.x(x);
            animatable.y(y);
          },
          { signal },
        );
      }

      const dismissIntro = () => {
        ac.abort();
        animate(".intro_center, .intro_btm, .inter", {
          opacity: 0,
          duration: 250,
          ease: cubicEase,
        }).then(() => {
          introEl.style.zIndex = -1;
          document.body.style.overflow = "";
          if (lenis) lenis.start();
          resolve();
        });
      };

      window.addEventListener("wheel", dismissIntro, {
        once: true,
        passive: true,
        signal,
      });
      window.addEventListener("touchmove", dismissIntro, {
        once: true,
        passive: true,
        signal,
      });
    });
  });
}

/** Use before page-specific entrance animations; skips if intro markup is absent. */
export function playSharedIntroIfPresent(opts) {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro(opts);
}

const DEFAULT_FLOWER_Y = "50%";

const INTRO_PAGE_CONFIG = {
  home: { opacity: 0.5, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
  about: { opacity: 1, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
  work: { opacity: 1, flowerY: "-50%", fill: "#ffffff" },
  workContent: { opacity: 0, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
};

let lastFlowerY = DEFAULT_FLOWER_Y;

let defaultFill = null;

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

  if (flowerGroup && config.flowerY !== lastFlowerY) {
    animate(flowerGroup, {
      translateY: config.flowerY,
      duration: 1500,
      ease: cubicEase,
    });
    lastFlowerY = config.flowerY;
  }

  if (paths.length) {
    animate(paths, {
      fill: { to: config.fill || defaultFill },
      duration: 400,
      ease: cubicEase,
    });
  }
}
