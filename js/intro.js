import {
  animate,
  createAnimatable,
  createTimeline,
  cubicBezier,
} from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

let introInterAc = null;
/** Blocks native scroll during opening timeline on non-home (wheel/touchmove preventDefault). */
let introScrollPhase1Ac = null;

function lockIntroBodyScroll() {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unlockIntroBodyScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

export function playHomeIntro({ isHome = false } = {}) {
  if (introInterAc) {
    introInterAc.abort();
    introInterAc = null;
  }
  if (introScrollPhase1Ac) {
    introScrollPhase1Ac.abort();
    introScrollPhase1Ac = null;
  }
  unlockIntroBodyScroll();

  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  return new Promise((resolve) => {
    if (!isHome) {
      lockIntroBodyScroll();
      introScrollPhase1Ac = new AbortController();
      const blockScroll = (e) => e.preventDefault();
      window.addEventListener("wheel", blockScroll, {
        passive: false,
        signal: introScrollPhase1Ac.signal,
      });
      window.addEventListener("touchmove", blockScroll, {
        passive: false,
        signal: introScrollPhase1Ac.signal,
      });
    }

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
      introScrollPhase1Ac?.abort();
      introScrollPhase1Ac = null;

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
            if (homeWrap)
              homeListAnim = animate(homeWrap, {
                y: ["100vh", 0],
                duration: 1000,
                ease: cubicEase,
              });
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
          resolve();
          unlockIntroBodyScroll();
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
  if (introScrollPhase1Ac) {
    introScrollPhase1Ac.abort();
    introScrollPhase1Ac = null;
  }
  unlockIntroBodyScroll();
}

/** @param {{ isHome?: boolean }} [opts] */
export function playSharedIntroIfPresent(opts) {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro(opts);
}

const INTRO_PAGE_CONFIG = {
  home: { opacity: 0.3, flowerY: "50%", fill: "#EE7F31", fillOpacity: 0.5 },
  about: { opacity: 1, flowerY: "50%", fill: "#EE7F31", fillOpacity: 0.5 },
  work: { opacity: 1, flowerY: "-50%", fill: "#ffffff", fillOpacity: 1 },
  workContent: {
    opacity: 0,
    flowerY: "-50%",
    fill: "#EE7F31",
    fillOpacity: 0.5,
  },
};

let defaultFill = null;

/** Current translateY as % of element height (CSS % resolves against self). */
function readFlowerTranslateYPercent(el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  const h = el.getBoundingClientRect().height || 1;
  return (m.m42 / h) * 100;
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

  const tl = createTimeline({ defaults: { ease: cubicEase } });

  const introOpacity = parseFloat(getComputedStyle(introEl).opacity);
  tl.add(
    introEl,
    { opacity: [introOpacity, config.opacity], duration: 400 },
    0,
  );

  if (flowerGroup) {
    const flowerFromY = `${readFlowerTranslateYPercent(flowerGroup)}%`;
    tl.add(
      flowerGroup,
      { y: [flowerFromY, config.flowerY], duration: 1500 },
      0,
    );
  }

  if (paths.length) {
    const toFill = config.fill || defaultFill;
    const fromFill = getComputedStyle(paths[0]).fill;
    tl.add(
      paths,
      { fill: [fromFill, toFill], opacity: config.fillOpacity, duration: 400 },
      0,
    );
  }
}
