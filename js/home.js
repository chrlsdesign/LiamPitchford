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
const played = new Set();
let lenis = null;
let introPlayed = false;

export function initHome() {
  //Lenis goes first
  lenis = new Lenis({
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

  lenis.scrollTo(0, { immediate: true });

  //The rest starts here

  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const layout = createLayout("body");

  if (introPlayed) {
    // skip intro, just init scroll reveal directly
    initScrollReveal();
    return;
  } else {
    initIntro();
  }

  console.log(introPlayed);
  function initIntro() {
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
            } else {
              return window.innerWidth - rect.right - padding;
            }
          },
        },
        750,
      )
      .add(".intro", { opacity: 0, duration: 250 });
  }

  function initScrollReveal() {
    const originalList = document.querySelector(".home_list");
    const items = originalList.querySelectorAll(".home_item");

    items.forEach((item, i) => {
      const isOdd = i % 2 === 0;

      const observer = onScroll({
        target: item,
        repeat: false,
        onEnter: () => {
          if (!introPlayed) return;
          if (played.has(item)) return;
          played.add(item);
          animate(item, {
            filter: ["blur(20px)", "blur(0px)"],
            duration: 750,
            ease: cubicEase,
          });
        },
        onEnterBackward: () => {
          if (!introPlayed) return;
          if (played.has(item)) return;
          played.add(item);
          animate(item, {
            filter: ["blur(20px)", "blur(0px)"],
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

      const w = crsRect.width;
      const h = crsRect.height;
      const offsetX = 8;
      const offsetY = 8;

      const x = Math.min(
        Math.max(e.clientX - linkRect.left + offsetX, 0),
        Math.max(0, linkRect.width - w),
      );
      const y = Math.min(
        Math.max(e.clientY - linkRect.top + offsetY, 0),
        Math.max(0, linkRect.height - h),
      );

      crs.style.transform = `translate(${x}px, ${y}px)`;
    });

    link.addEventListener("mouseenter", () => {
      animate(crs, { opacity: 1, duration: 800, ease: "inOut(1.68)" });
    });

    link.addEventListener("mouseleave", () => {
      animate(crs, { opacity: 0, duration: 800, ease: "inOut(1.68)" });
    });
  });
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
  lenis.destroy();
  introPlayed = true;
  scrollObservers.forEach((observer) => observer.revert());
  scrollObservers = [];
  played.clear();
  document
    .querySelectorAll(".home_list:not(.is-clone) .home_item")
    .forEach((item, i) => {
      const isOdd = i % 2 === 0;
      item.style.clipPath = isOdd
        ? "inset(0% 100% 100% 0%)"
        : "inset(0% 0% 100% 100%)";
    });
  resetScrollReveal();
}
