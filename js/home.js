import {
  animate,
  cubicBezier,
  createLayout,
  onScroll,
  utils,
  createTimeline,
} from "animejs";
import Lenis from "lenis";
import {
  detachIntroInterListeners,
  playSharedIntroIfPresent,
  updateIntroForPage,
} from "./intro.js";

let scrollObservers = [];
const played = new Set();
let lenis = null;
let lenisRafActive = false;
let destroyGalleryZoom = null;
let infiniteStrip = null;

const HOME_ITEM_BLUR_START = "blur(20px)";
const HOME_ITEM_BLUR_END = "blur(0px)";
const HOME_LIST_MODAL_BLUR = "blur(12px)";

function lockModalScroll() {
  if (lenis) lenis.stop();
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unlockModalScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  if (lenis) lenis.start();
}

/**
 * Sets `ratio` (width ÷ height) and inline `aspect-ratio` when dimensions are known.
 * Cloned modal media keeps the same ratio. Webflow: img[ratio], video[ratio] { aspect-ratio: attr(ratio number); } where supported, or rely on the inline style we set.
 */
function applyMediaAspectRatio(media) {
  const apply = () => {
    let w;
    let h;
    if (media.tagName === "IMG") {
      w = media.naturalWidth;
      h = media.naturalHeight;
    } else if (media.tagName === "VIDEO") {
      w = media.videoWidth;
      h = media.videoHeight;
    } else {
      return;
    }
    if (!w || !h) return;
    const r = w / h;
    const str = Number(r.toFixed(6)).toString();
    media.setAttribute("ratio", str);
    media.style.aspectRatio = str;
  };

  if (media.tagName === "IMG") {
    if (media.complete && media.naturalWidth > 0) {
      apply();
    } else {
      media.addEventListener("load", apply, { once: true });
    }
  } else if (media.tagName === "VIDEO") {
    if (
      media.readyState >= HTMLMediaElement.HAVE_METADATA &&
      media.videoWidth > 0
    ) {
      apply();
    } else {
      media.addEventListener("loadedmetadata", apply, { once: true });
    }
  }
}

function initHomeEmbedMediaAspectRatios(root = document) {
  root.querySelectorAll(".home_embed img, .home_embed video").forEach((el) => {
    applyMediaAspectRatio(el);
  });
}

function getHomeListItems() {
  const list = document.querySelector(".home_list");
  return list ? [...list.querySelectorAll(".home_item")] : [];
}

function setHomeItemsBlurred(items) {
  items.forEach((item) => {
    animate(item, { filter: HOME_ITEM_BLUR_START, duration: 0 });
  });
}

function initScrollReveal(cubicEase) {
  const originalList = document.querySelector(".home_list");
  if (!originalList) return;
  const items = originalList.querySelectorAll(".home_item");

  items.forEach((item) => {
    const observer = onScroll({
      target: item,
      repeat: false,
      enter: "bottom top",
      onEnter: () => {
        if (played.has(item)) return;
        played.add(item);
        animate(item, {
          filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
          duration: 750,
          ease: cubicEase,
        });
      },
      onEnterBackward: () => {
        if (played.has(item)) return;
        played.add(item);
        animate(item, {
          filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
          duration: 750,
          ease: cubicEase,
        });
      },
    });

    lenis.on("scroll", () => observer.refresh());

    scrollObservers.push(observer);
  });
}

function attachLinkCursor(link) {
  const crs = link.querySelector(".home_flw--crs");
  if (!crs) return;

  link.addEventListener("mousemove", (e) => {
    const linkRect = link.getBoundingClientRect();
    const crsRect = crs.getBoundingClientRect();

    const w = crsRect.width;
    const h = crsRect.height;
    const offsetX = 8;
    const offsetY = 8;

    const x = Math.min(
      Math.max(e.clientX - linkRect.left - offsetX, 0),
      Math.max(0, linkRect.width - w),
    );
    const y = Math.min(
      Math.max(e.clientY - linkRect.top - offsetY, 0),
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
}

/**
 * Custom infinite scroll for `.home_list`.
 * Clones originals above and below, translates the strip via transform, and
 * teleports at the boundaries. Feeds off Lenis' scroll delta so momentum still
 * feels smooth, but without Lenis' own `infinite: true` seam on mobile.
 */
function startInfiniteStrip() {
  if (!lenis) return;
  if (infiniteStrip) return;

  const strip = document.querySelector(".home_list");
  if (!strip) return;

  const originals = [...strip.children];
  if (!originals.length) return;

  const clonesBefore = originals.map((el) => {
    const c = el.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.classList.add("is-clone");
    return c;
  });
  const clonesAfter = originals.map((el) => {
    const c = el.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.classList.add("is-clone");
    return c;
  });

  for (let i = clonesBefore.length - 1; i >= 0; i--) {
    strip.prepend(clonesBefore[i]);
  }
  clonesAfter.forEach((el) => strip.appendChild(el));

  // Clones skip the reveal blur; they're duplicates for visual looping only.
  [...clonesBefore, ...clonesAfter].forEach((el) => {
    el.style.filter = "none";
    el.querySelectorAll(".home_cms--link").forEach(attachLinkCursor);
  });

  const getOrigH = () =>
    originals.reduce((h, el) => h + el.offsetHeight, 0);

  const origH = getOrigH();
  let currentY = -origH;
  let targetY = -origH;
  strip.style.transform = `translate3d(0, ${currentY}px, 0)`;

  const onScrollDelta = (e) => {
    const d = typeof e?.deltaY === "number" ? e.deltaY : 0;
    if (d) targetY -= d;
  };
  lenis.on("scroll", onScrollDelta);

  let running = true;
  let rafId = 0;
  const loop = () => {
    if (!running) return;

    currentY += (targetY - currentY) * 0.075;

    const h = getOrigH();
    if (currentY > 0) {
      currentY -= h;
      targetY -= h;
    }
    if (currentY < -(2 * h)) {
      currentY += h;
      targetY += h;
    }

    strip.style.transform = `translate3d(0, ${Math.round(currentY)}px, 0)`;
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  infiniteStrip = {
    strip,
    clones: [...clonesBefore, ...clonesAfter],
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      if (lenis && typeof lenis.off === "function") {
        lenis.off("scroll", onScrollDelta);
      }
    },
  };
}

function stopInfiniteStrip() {
  if (!infiniteStrip) return;
  infiniteStrip.stop();
  infiniteStrip.clones.forEach((el) => el.remove());
  if (infiniteStrip.strip) infiniteStrip.strip.style.transform = "";
  infiniteStrip = null;
}

export function initHome({
  playSharedIntro = false,
  content = document,
  pageKey = "home",
} = {}) {
  const hasSharedIntro = !!document.querySelector(".intro");

  // Lenis is kept only as a smooth input layer. The infinite loop is handled
  // by `startInfiniteStrip()` (custom clone + translate + teleport) to avoid
  // Lenis' mobile seam jump at the wrap point.
  lenis = new Lenis({
    smoothWheel: true,
    smoothTouch: true,
    touchMultiplier: 1.25,
  });

  lenisRafActive = true;
  function raf(time) {
    if (!lenisRafActive || !lenis) return;
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  lenis.scrollTo(0, { immediate: true });
  if (playSharedIntro && hasSharedIntro) {
    // Keep the intro deterministic by blocking all scroll input
    // until shared intro animation has finished.
    lenis.stop();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  //The rest starts here
  const homeList = utils.$(".home_list")[0];
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

  if (playSharedIntro) {
    const scrollThres = document.querySelector(".scroll-thres");
    const tl = createTimeline();

    tl.add(homeList, { y: ["100vh", 0], duration: 4000 }, 0).add(
      ".intro_center, .intro_btm",
      { opacity: 0 },
      0,
    );

    const introObs = onScroll({
      target: scrollThres,
      enter: "top top",
      leave: "top center",
      onLeaveForward: function handler(self) {
        self.revert();
        if (scrollThres) scrollThres.remove();
        detachIntroInterListeners();
        animate(".inter", { opacity: 0, duration: 200, ease: cubicEase });
        animate(".nav", { y: ["-100%", "0%"], duration: 400, ease: cubicEase });
        if (homeList) animate(homeList, { y: 0, duration: 0 });
        startInfiniteStrip();
      },
      sync: true,
    });

    introObs.link(tl);
  } else {
    const scrollThres = document.querySelector(".scroll-thres");
    if (scrollThres) scrollThres.remove();

    if (homeList) animate(homeList, { y: 0, duration: 0 });
    animate(".main", { opacity: 1, pointerEvents: "auto", duration: 0 });
    startInfiniteStrip();
  }

  const homeItems = getHomeListItems();
  if (homeItems.length) setHomeItemsBlurred(homeItems);

  if (playSharedIntro) {
    playSharedIntroIfPresent({ lenis, isHome: true }).then(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      updateIntroForPage(pageKey);
      initScrollReveal(cubicEase);
    });
  } else {
    initScrollReveal(cubicEase);
  }

  document.querySelectorAll(".home_cms--link").forEach(attachLinkCursor);

  initDialog();
  /* Gallery Zoom */
  //destroyGalleryZoom = initGalleryZoom();
}

function initDialog() {
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const homeList = document.querySelector(".home_list");

  const gItems = utils.$(".home_item .home_embed");

  gItems.forEach(($embed, i) => {
    const id = `home-embed-${i}`;
    const media = $embed.querySelector("img, video");
    if (media) {
      media.setAttribute("data-layout-id", id);
    } else {
      $embed.setAttribute("data-layout-id", id);
    }
  });

  initHomeEmbedMediaAspectRatios();

  const $dialog = document.getElementById("layout-dialog");

  const modalLayout = createLayout($dialog, {
    children: [".home_embed", "img", "video"],
  });

  let lastModalListDuration = 400;

  const closeModal = (e) => {
    unlockModalScroll();
    const duration = lastModalListDuration;
    if (homeList) {
      animate(homeList, {
        opacity: 1,
        filter: HOME_ITEM_BLUR_END,
        duration,
        ease: cubicEase,
      });
    }
    let $item;
    modalLayout.update(({ root }) => {
      $dialog.close();
      $item = gItems.find((item) => item.classList.contains("is-open"));
      $item.classList.remove("is-open");
      $item.focus();
    });
  };

  const openModal = (e) => {
    const $target = e.target;
    const $item =
      $target.closest(".home_embed") ||
      $target.closest(".home_item")?.querySelector(".home_embed");
    if (!$item) return;
    lockModalScroll();
    const duration = Number($item.dataset.duration) || 400;
    lastModalListDuration = duration;
    if (homeList) {
      animate(homeList, {
        opacity: 0,
        filter: HOME_LIST_MODAL_BLUR,
        duration,
        ease: cubicEase,
      });
    }
    const media = $item.querySelector("img, video");
    const $clone = media ? media.cloneNode(true) : $item.cloneNode(true);
    $dialog.innerHTML = "";
    $dialog.appendChild($clone);
    if ($clone.tagName === "IMG" || $clone.tagName === "VIDEO") {
      applyMediaAspectRatio($clone);
    }
    modalLayout.update(
      () => {
        $dialog.showModal();
        $item.classList.add("is-open");
      },
      {
        duration: $item.dataset.duration,
        ease: cubicEase,
      },
    );
  };

  gItems.forEach(($gItem) => $gItem.addEventListener("click", openModal));
  $dialog.addEventListener("cancel", closeModal);
  $dialog.addEventListener("click", closeModal);
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
  detachIntroInterListeners();
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  lenisRafActive = false;
  if (destroyGalleryZoom) {
    destroyGalleryZoom();
    destroyGalleryZoom = null;
  }
  stopInfiniteStrip();
  if (lenis) {
    lenis.stop();
    lenis.destroy();
    lenis = null;
  }
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
