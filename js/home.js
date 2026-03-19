import {
  animate,
  createTimeline,
  splitText,
  stagger,
  utils,
  cubicBezier,
  createLayout,
  onScroll,
} from "animejs";
import Lenis from "lenis";

let scrollObservers = [];

export function initHome() {
  let introPlayed = false;
  if (introPlayed) {
    // skip intro, just init scroll reveal directly
    initScrollReveal();
    return;
  }

  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const layout = createLayout("body");
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
    .call(() => {
      const video = document.querySelector(".intro_holder video");
      const firstLink = document.querySelector(".home_cms--link");
      if (!video || !firstLink) return;

      // record positions BEFORE the DOM change
      layout.record();

      // make the DOM change
      firstLink.prepend(video);
      video.classList.add("active");

      // now animate from recorded positions to new positions
      layout.animate({
        duration: 1000,
        ease: cubicEase,
        onComplete: () => {
          animate(".intro", { opacity: 0, duration: 600 });
          introPlayed = true;
          initScrollReveal();
        },
      });
    });

  function initScrollReveal() {
    const originalList = document.querySelector(".home_list");
    const items = originalList.querySelectorAll(".home_item");

    items.forEach((item, i) => {
      const isOdd = i % 2 === 0;

      const observer = onScroll({
        target: item,
        sync: false,
        repeat: false,
        onEnter: () => {
          if (!introPlayed) return;
          animate(item, {
            clipPath: isOdd
              ? ["inset(0% 100% 100% 0%)", "inset(0% 0% 0% 0%)"]
              : ["inset(0% 0% 100% 100%)", "inset(0% 0% 0% 0%)"],
            duration: 750,
            ease: cubicEase,
          });
        },
      });

      scrollObservers.push(observer);
    });
  }

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

function resetScrollReveal() {
  // revert each observer
  scrollObservers.forEach((observer) => observer.revert());
  scrollObservers = [];

  // reset clip-path back to hidden
  document.querySelectorAll(".home_item").forEach((item, i) => {
    const isOdd = i % 2 === 0;
    item.style.clipPath = isOdd
      ? "inset(0% 100% 100% 0%)"
      : "inset(0% 0% 100% 100%)";
  });
}

export function destroyHome() {
  resetScrollReveal();
}
