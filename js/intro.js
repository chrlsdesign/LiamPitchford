import { createTimeline } from "animejs";

/** Home-only hero intro (must not be named `playIntro` — callers use a `playIntro` option flag). */
export function playHomeIntro() {
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

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
