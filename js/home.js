import { animate, cubicBezier, createLayout, onScroll, utils } from "animejs";
import Lenis from "lenis";
import { playSharedIntroIfPresent, updateIntroForPage } from "./intro.js";

let scrollObservers = [];
const played = new Set();
let lenis = null;
let lenisRafActive = false;
let destroyGalleryZoom = null;

const HOME_ITEM_BLUR_START = "blur(20px)";
const HOME_ITEM_BLUR_END = "blur(0px)";
const HOME_LIST_MODAL_BLUR = "blur(12px)";

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
    infinite: true,
    smoothTouch: true,
    syncTouch: true,
    touchMultiplier: 1.5,
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

  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);

  const homeItems = getHomeListItems();
  if (homeItems.length) setHomeItemsBlurred(homeItems);

  if (playSharedIntro) {
    playSharedIntroIfPresent({ lenis }).then(() => {
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

  gItems.forEach(($el, i) => {
    $el.setAttribute("data-layout-id", `home-embed-${i}`);
  });

  const $dialog = document.getElementById("layout-dialog");

  const modalLayout = createLayout($dialog, {
    children: [".home_embed", "img", "video"],
  });

  let lastModalListDuration = 400;

  const closeModal = (e) => {
    const duration = lastModalListDuration;
    if (homeList) {
      animate(homeList, {
        scale: 1,
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
    const duration = Number($item.dataset.duration) || 400;
    lastModalListDuration = duration;
    if (homeList) {
      animate(homeList, {
        scale: 0.9,
        filter: HOME_LIST_MODAL_BLUR,
        duration,
        ease: cubicEase,
      });
    }
    const $clone = $item.cloneNode(true);
    $dialog.innerHTML = "";
    $dialog.appendChild($clone);
    modalLayout.update(
      () => {
        $dialog.showModal();
        $item.classList.add("is-open");
      },
      {
        duration: $item.dataset.duration,
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
  lenisRafActive = false;
  if (destroyGalleryZoom) {
    destroyGalleryZoom();
    destroyGalleryZoom = null;
  }
  if (lenis) {
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
