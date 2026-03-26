import { createTimeline, cubicBezier } from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

/**
 * Full-screen intro (.intro / .intro_title / .intro_center).
 * On non-home templates, include the same intro block in your global layout or this no-ops.
 */
export function playHomeIntro() {
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
    )
    .add(".intro", { opacity: 0, duration: 250 });

  return tl.then();
}

/** Use before page-specific entrance animations; skips if intro markup is absent. */
export function playSharedIntroIfPresent() {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro();
}
