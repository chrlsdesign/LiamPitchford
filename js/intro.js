import {
  animate,
  createAnimatable,
  createTimeline,
  cubicBezier,
} from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

let introInterAc = null;
/** Blocks native scroll during the whole intro (wheel/touchmove preventDefault). */
let introScrollLockAc = null;

function lockIntroBodyScroll() {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  // `overflow: hidden` alone doesn't stop iOS Safari touch scrolling — touch-action
  // + overscroll-behavior do. Belt-and-suspenders with wheel/touchmove listeners below.
  document.body.style.touchAction = "none";
  document.body.style.overscrollBehavior = "none";

  if (introScrollLockAc) introScrollLockAc.abort();
  introScrollLockAc = new AbortController();
  const blockScroll = (e) => e.preventDefault();
  window.addEventListener("wheel", blockScroll, {
    passive: false,
    signal: introScrollLockAc.signal,
  });
  window.addEventListener("touchmove", blockScroll, {
    passive: false,
    signal: introScrollLockAc.signal,
  });
}

function unlockIntroBodyScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.overscrollBehavior = "";

  if (introScrollLockAc) {
    introScrollLockAc.abort();
    introScrollLockAc = null;
  }
}

export function playHomeIntro({ isHome = false } = {}) {
  if (introInterAc) {
    introInterAc.abort();
    introInterAc = null;
  }
  unlockIntroBodyScroll();

  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  // Lock scroll on every page for the full intro (opening timeline + wait for
  // first-scroll dismiss). `unlockIntroBodyScroll` runs after dismiss completes.
  lockIntroBodyScroll();

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
      const ac = new AbortController();
      introInterAc = ac;

      const inter = document.querySelector(".inter");
      const svg = document.querySelector(".intro_flower");
      if (inter) {
        const animatable = createAnimatable(inter, {
          x: { duration: 600, ease: "out(3)" },
          y: { duration: 600, ease: "out(3)" },
        });
        document.addEventListener(
          "mousemove",
          (e) => {
            const rect = svg.getBoundingClientRect();
            const vb = svg.viewBox.baseVal;

            const scaleX = vb.width / rect.width;
            const scaleY = vb.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX - inter.offsetWidth / 2;
            const y = (e.clientY - rect.top) * scaleY - inter.offsetHeight / 2;

            animate(inter, { opacity: 1, duration: 250 });
            animatable.x(x);
            animatable.y(y);
          },
          { signal: ac.signal },
        );
      }

      const dismiss = () => {
        ac.abort();
        introInterAc = null;

        let homeListAnim = null;

        const fade = animate(".intro_center, .intro_btm, .inter", {
          opacity: 0,
          duration: 250,
          ease: cubicEase,
        });

        // anime.js v4 animations have ONE `_resolve` slot — each `.then()`
        // call overwrites the previous. Call `.then()` once per animation
        // and chain on the returned real Promise.
        const fadeDone = fade.then(() => {
          if (isHome) {
            const homeWrap = document.querySelector(".home_wrap");
            if (homeWrap) {
              homeListAnim = createTimeline()
                .add(homeWrap, {
                  y: ["100vh", 0],
                  duration: 1000,
                  ease: cubicEase,
                })
                .add(".home_list.is-clone", {
                  opacity: [0, 1],
                  duration: 500,
                });
            }
          }
          animate(".main", {
            opacity: 1,
            pointerEvents: "auto",
            duration: 400,
            ease: cubicEase,
          });
          animate(".nav", {
            y: ["-100%", "0%"],
            duration: 400,
            ease: cubicEase,
          });
        });

        const listDone = homeListAnim
          ? homeListAnim.then(() => {})
          : Promise.resolve();

        Promise.all([fadeDone, listDone]).then(() => {
          unlockIntroBodyScroll();
          resolve();
        });
      };

      const dismissOnScrollIntent = (e) => {
        e.preventDefault();
        dismiss();
      };
      window.addEventListener("wheel", dismissOnScrollIntent, {
        passive: false,
        once: true,
        signal: ac.signal,
      });
      window.addEventListener("touchmove", dismissOnScrollIntent, {
        passive: false,
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
  unlockIntroBodyScroll();
}

/** @param {{ isHome?: boolean }} [opts] */
export function playSharedIntroIfPresent(opts) {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro(opts);
}

const INTRO_PAGE_CONFIG = {
  home: {
    opacity: 0.2,
    flowerY: "50%",
    fill: "#EE7F31",
    fillOpacity: 0.5,
    mobile: { flowerY: "25%" },
  },
  about: {
    opacity: 1,
    flowerY: "50%",
    fill: "#EE7F31",
    fillOpacity: 0.5,
    mobile: { flowerY: "25%" },
  },
  work: {
    opacity: 1,
    flowerY: "-50%",
    fill: "#ffffff",
    fillOpacity: 1,
    mobile: { flowerY: "-25%" },
  },
  workContent: {
    opacity: 0.2,
    flowerY: "-50%",
    fill: "#EE7F31",
    fillOpacity: 0.5,
    mobile: { flowerY: "-25%" },
  },
};

const MOBILE_INTRO_MQ =
  typeof window !== "undefined"
    ? window.matchMedia("(max-width: 576px)")
    : null;

function resolveIntroConfig(page) {
  const base = INTRO_PAGE_CONFIG[page];
  if (!base) return null;
  if (MOBILE_INTRO_MQ?.matches && base.mobile) {
    return { ...base, ...base.mobile };
  }
  return base;
}

let defaultFill = null;

export function updateIntroForPage(page) {
  const introEl = document.querySelector(".intro_bg");
  if (!introEl) return;

  const config = resolveIntroConfig(page);
  if (!config) return;

  const flowerGroup = introEl.querySelector(".flower_group");
  const paths = introEl.querySelectorAll(".flower_group .front");

  if (defaultFill === null && paths.length) {
    defaultFill = getComputedStyle(paths[0]).fill;
  }

  const tl = createTimeline({ defaults: { ease: cubicEase } });

  tl.add(introEl, { opacity: config.opacity, duration: 400 }, 0);

  if (flowerGroup) {
    tl.add(flowerGroup, { y: config.flowerY, duration: 1500 }, 0);
  }

  if (paths.length) {
    const toFill = config.fill || defaultFill;
    tl.add(
      paths,
      { fill: toFill, opacity: config.fillOpacity, duration: 400 },
      0,
    );
  }
}
