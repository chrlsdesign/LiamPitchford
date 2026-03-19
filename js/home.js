import {
  animate,
  createTimeline,
  splitText,
  stagger,
  utils,
  cubicBezier,
  createLayout,
} from "animejs";
import Lenis from "lenis";

export function initHome() {
  document
    .querySelector(".intro_holder video")
    .setAttribute("data-layout-id", "intro-video");

  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const layout = createLayout("body", { children: true });
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
      ".intro_holder video",
      {
        scale: [0, 0.5],
      },
      750,
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
          } else {
            return window.innerWidth - rect.right - padding;
          }
        },
      },
      750,
    )
    .add(".intro_holder video", {
      scale: 1,
    })
    .add(".intro", { backgroundColor: "rgba(255,255,255,0)", duration: 250 })
    .add(
      ".home_item:nth-of-type(2n-1)",
      {
        clipPath: ["inset(0% 100% 100% 0%)", "inset(0% 0% 0% 0%)"],
        duration: 750,
      },
      "-=0",
    )
    .add(
      ".home_item:nth-of-type(2n)",
      {
        clipPath: ["inset(0% 0% 100% 100%)", "inset(0% 0% 0% 0%)"],
        duration: 750,
      },
      "-=750",
    )
    .then(() => {
      layout.update(
        ({ root }) => {
          const video = root.querySelector(".intro_holder");
          const firstLink = root.querySelector(".home_cms--link");
          firstLink.appendChild(video);
        },
        {
          duration: 1000,
          ease: cubicEase,
          onComplete: () => {
            animate(".intro", {
              opacity: 0,
              duration: 600,
              delay: 700,
            });
          },
        },
      );
    });

  document.querySelectorAll(".home_cms--link").forEach((link) => {
    const crs = link.querySelector(".home_flw--crs");

    link.addEventListener("mousemove", (e) => {
      const linkRect = link.getBoundingClientRect();
      const crsRect = crs.getBoundingClientRect();

      const halfW = crsRect.width / 2;
      const halfH = crsRect.height / 2;

      const x = Math.min(
        Math.max(e.clientX - linkRect.left, halfW),
        linkRect.width - halfW,
      );
      const y = Math.min(
        Math.max(e.clientY - linkRect.top, halfH),
        linkRect.height - halfH,
      );

      crs.style.transform = `translate(${x - halfW}px, ${y - halfH}px)`;
    });

    link.addEventListener("mouseenter", () => {
      animate(crs, { opacity: 1, duration: 800, ease: "inOut(1.68)" });
    });

    link.addEventListener("mouseleave", () => {
      animate(crs, { opacity: 0, duration: 800, ease: "inOut(1.68)" });
    });
  });

  const lenis = new Lenis({
    infinite: true,
    smoothTouch: true,
    syncTouch: true,
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
