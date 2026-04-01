import { animate, createAnimatable, createTimeline, cubicBezier } from "animejs";

const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

export function playHomeIntro() {
  const introEl = document.querySelector(".intro");
  if (!introEl) return Promise.resolve();

  const circle = document.querySelector(".intro-circle");

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

        introEl.addEventListener(
          "mousemove",
          (e) => {
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
        animate(introEl, {
          opacity: 0,
          duration: 250,
          ease: cubicEase,
        }).then(() => {
          document.body.style.overflow = "";
          resolve();
        });
      };

      window.addEventListener("wheel", dismissIntro, {
        once: true,
        passive: true,
        signal,
      });
      window.addEventListener(
        "touchmove",
        dismissIntro,
        { once: true, passive: true, signal },
      );
    });
  });
}

/** Use before page-specific entrance animations; skips if intro markup is absent. */
export function playSharedIntroIfPresent() {
  if (!document.querySelector(".intro")) return Promise.resolve();
  return playHomeIntro();
}
