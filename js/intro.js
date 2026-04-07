import {
  animate,
  createAnimatable,
  createTimeline,
  cubicBezier,
  onScroll,
  Timeline,
} from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

/** Smoothness for ScrollObserver ↔ timeline sync (0–1). See https://animejs.com/documentation/events/onscroll/scrollobserver-synchronisation-modes/smooth-scroll */
const INTRO_SCROLL_SYNC = 0.25;

/** Clears scroll-linked intro scrub (ScrollObserver + timeline). */
let introScrubCleanup = null;

export function detachHomeIntroScrollScrub() {
  introScrubCleanup?.();
  introScrubCleanup = null;
}

/**
 * Homepage-only hook: runs after the opening timeline, when Lenis scrub phase begins.
 *
 * @param {object} ctx
 * @param {HTMLElement} ctx.introEl
 * @param {object|null} ctx.lenis
 * @param {HTMLElement|null} ctx.circle
 * @param {AbortSignal} ctx.signal
 * @param {number} ctx.scrubPx — scroll distance that fully dismisses intro (synced with list padding)
 * @param {HTMLElement|null} ctx.homeList
 * @param {object|undefined} ctx.scrollObs — anime.js ScrollObserver from onScroll()
 * @param {object|undefined} ctx.scrubTl — scroll-linked timeline
 */
export function onHomeIntroInteractivePhase(ctx) {
  void ctx;
}

export function playHomeIntro({ lenis = null, isHome = false } = {}) {
  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  const circle = document.querySelector(".inter");

  return new Promise((resolve) => {
    if (isHome && lenis) {
      lenis.stop();
    }

    const introTl = createTimeline({
      defaults: { duration: 700, ease: cubicEase },
    });

    introTl
      .add(
        ".intro_title",
        {
          translateX: (el, i) => (i === 0 ? ["100%", "0%"] : ["-100%", "0%"]),
          duration: 500,
          delay: 250,
        },
        0,
      )
      .add(
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

    const finishIntroNonHome = () => {
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
    };

    introTl.then(() => {
      if (!isHome) {
        finishIntroNonHome();
        return;
      }

      document.body.style.overflow = "";

      const homeList = document.querySelector(".home_list");
      const scrubPx = Math.max(
        1,
        window.innerHeight,
        introEl.getBoundingClientRect().height,
      );

      const ac = new AbortController();
      const { signal } = ac;

      let scrubDone = false;

      const finalizeIntroScrub = () => {
        if (scrubDone) return;
        scrubDone = true;
        detachHomeIntroScrollScrub();
        ac.abort();

        introEl.style.transform = "";
        introEl.style.visibility = "hidden";
        introEl.style.pointerEvents = "none";
        introEl.style.zIndex = "-1";
        if (homeList) {
          homeList.style.paddingTop = "0";
        }

        if (lenis) {
          lenis.options.infinite = true;
          lenis.resize();
        }

        animate(".intro_center, .intro_btm, .inter", {
          opacity: 0,
          duration: 0,
        }).then(() => {
          resolve();
        });
      };

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
              duration: 200,
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

      if (!lenis) {
        const dismissFallback = () => {
          ac.abort();
          finishIntroNonHome();
        };
        window.addEventListener("wheel", dismissFallback, {
          once: true,
          passive: true,
          signal,
        });
        window.addEventListener("touchmove", dismissFallback, {
          once: true,
          passive: true,
          signal,
        });
        return;
      }

      if (homeList) {
        homeList.style.paddingTop = `${scrubPx}px`;
      }

      const scrollObs = onScroll({
        container: document.body,
        target: document.documentElement,
        enter: "start start",
        leave: `start+=${scrubPx} start`,
        sync: true,
        onSyncComplete: () => finalizeIntroScrub(),
      });

      const scrubTl = new Timeline({
        autoplay: scrollObs,
        defaults: { ease: "linear" },
      });

      scrubTl.add(
        introEl,
        {
          translateY: ["0%", "-100%"],
          duration: 1,
          ease: "linear",
        },
        0,
      );

      if (homeList) {
        scrubTl.add(
          homeList,
          {
            paddingTop: [`${scrubPx}px`, "0px"],
            duration: 1,
            ease: "linear",
          },
          0,
        );
      }

      introScrubCleanup = () => {
        scrollObs.revert();
        scrubTl.cancel();
      };

      scrubTl.init();
      scrollObs.refresh();

      onHomeIntroInteractivePhase({
        introEl,
        lenis,
        circle,
        signal,
        scrubPx,
        homeList,
        scrollObs,
        scrubTl,
      });

      lenis.resize();
      lenis.scrollTo(0, { immediate: true });
      lenis.start();
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
  home: { opacity: 0.2, flowerY: DEFAULT_FLOWER_Y, fill: "#EE7F31" },
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
