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
      debug: true,
      // Trigger when viewport bottom reaches the item top.
      // Because bounds are refreshed on lenis scroll, this still tracks correctly
      // even while `.home_list` is translated.
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

export function initHome({
  playSharedIntro = false,
  content = document,
  pageKey = "home",
} = {}) {
  //Lenis goes first
  lenis = new Lenis({
    infinite: false,
    smoothTouch: true,
    syncTouch: true,
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

  //The rest starts here
  const homeList = utils.$(".home_list")[0];
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

  if (playSharedIntro) {
    const scrollThres = document.querySelector(".scroll-thres");
    const tl = createTimeline();

    tl.add(homeList, { y: ["100vh", 0] }, 0).add(
      ".intro_center, .intro_btm",
      { opacity: 0 },
      0,
    );

    const introObs = onScroll({
      target: scrollThres,
      enter: "top top",
      leave: "top bottom",
      onLeaveForward: function handler(self) {
        self.revert();
        if (scrollThres) scrollThres.remove();
        detachIntroInterListeners();
        animate(".inter", { opacity: 0, duration: 200, ease: cubicEase });
        animate(".nav", { y: ["-100%", "0%"], duration: 400, ease: cubicEase });
        lenis.stop();
        lenis.options.infinite = true;
        lenis.resize();
        lenis.scrollTo(0, { immediate: true });
        requestAnimationFrame(() => lenis.start());
      },
      sync: true,
    });

    introObs.link(tl);
  } else {
    const scrollThres = document.querySelector(".scroll-thres");
    if (scrollThres) scrollThres.remove();

    if (homeList) animate(homeList, { y: 0, duration: 0 });
    lenis.options.infinite = true;
    lenis.resize();
    animate(".main", { opacity: 1, pointerEvents: "auto", duration: 0 });
  }

  const homeItems = getHomeListItems();
  if (homeItems.length) setHomeItemsBlurred(homeItems);

  if (playSharedIntro) {
    playSharedIntroIfPresent({ lenis, isHome: true }).then(() => {
      updateIntroForPage(pageKey);
      initScrollReveal(cubicEase);
    });
  } else {
    initScrollReveal(cubicEase);
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
  });

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
