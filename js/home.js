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
let destroyGalleryZoom = null;
let infiniteStrip = null;

const HOME_ITEM_BLUR_START = "blur(20px)";
const HOME_ITEM_BLUR_END = "blur(0px)";
const HOME_LIST_MODAL_BLUR = "blur(12px)";

function lockModalScroll() {
  if (infiniteStrip) infiniteStrip.stop();
}

function unlockModalScroll() {
  if (infiniteStrip) infiniteStrip.start();
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

/** Only the ORIGINAL list's items, never clones. */
function getHomeListItems() {
  const list = document.querySelector(".home_list:not(.is-clone)");
  return list ? [...list.querySelectorAll(".home_item")] : [];
}

function setHomeItemsBlurred(items) {
  items.forEach((item) => {
    animate(item, { filter: HOME_ITEM_BLUR_START, duration: 0 });
  });
}

/**
 * IntersectionObserver-based reveal. `onScroll` from anime.js can't see the
 * strip because the window never scrolls — the wrap is transformed instead —
 * so we watch real screen bounds, which update naturally with transforms.
 */
function initScrollReveal(cubicEase) {
  const originalList = document.querySelector(".home_list:not(.is-clone)");
  if (!originalList) return;
  const items = originalList.querySelectorAll(".home_item");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = entry.target;
        if (!played.has(item)) {
          played.add(item);
          animate(item, {
            filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
            duration: 750,
            ease: cubicEase,
          });
        }
        io.unobserve(item);
      }
    },
    { threshold: 0.01 },
  );

  items.forEach((item) => io.observe(item));
  scrollObservers.push({ revert: () => io.disconnect() });
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
 * Infinite loop scroll engine. Hierarchy:
 *   `.home_content--wrap` (wrap/strip, transformed)
 *     └─ `.home_list`      (grid — original + before/after clones)
 *         └─ `.home_item`*
 *
 * Clones the whole `.home_list` grid before and after the original, hijacks
 * wheel + touch, disables native scroll, and lerps/teleports the wrap. Based
 * on Claude's `infinite-loop-scroll.html` reference.
 */
function startInfiniteStrip() {
  if (infiniteStrip) return;
  const wrap = document.querySelector(".home_content--wrap");
  const origList = document.querySelector(".home_list:not(.is-clone)");
  if (!wrap || !origList) return;

  // Strip any inline transform left over from the intro (`.home_list { y: 0 }`)
  // so our clones and wrap-level transform are the only motion we juggle.
  origList.style.transform = "";

  const makeClone = () => {
    const c = origList.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.classList.add("is-clone");
    // Clones never get the reveal blur — visual duplicates for looping only.
    c.querySelectorAll(".home_item").forEach((el) => {
      el.style.filter = "none";
    });
    return c;
  };

  const before = makeClone();
  const after = makeClone();
  wrap.insertBefore(before, origList);
  wrap.appendChild(after);
  wrap.style.willChange = "transform";

  [before, after].forEach((list) => {
    list.querySelectorAll(".home_cms--link").forEach(attachLinkCursor);
  });

  // Kill native scroll + pinch/scroll gestures — engine owns all vertical input.
  const prev = {
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    bodyTouchAction: document.body.style.touchAction,
  };
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  const FRICTION = 0.075;
  const WHEEL_SPEED = 0.8;
  const TOUCH_SPEED = 1.0;
  const MOMENTUM = 0.92;

  let currentY = 0;
  let targetY = 0;
  let velocity = 0;
  let initialized = false;
  let running = true;
  let paused = false;

  let touching = false;
  let touchLastY = 0;
  let touchVel = 0;
  let touchLastT = 0;

  const getOrigH = () => origList.offsetHeight;

  let rafId = 0;
  const tick = () => {
    if (!running) return;

    // Defer initial offset into rAF so we read a laid-out height.
    if (!initialized) {
      const h = getOrigH();
      currentY = -h;
      targetY = -h;
      initialized = true;
    }

    if (!paused) {
      if (!touching) {
        targetY += velocity;
        velocity *= MOMENTUM;
        if (Math.abs(velocity) < 0.01) velocity = 0;
      }
      currentY += (targetY - currentY) * FRICTION;

      const h = getOrigH();
      // Strip layout: [beforeClone=h][original=h][afterClone=h]
      // Teleport DOWN: user scrolled past originals into `after` → wrap to top.
      if (currentY < -(2 * h)) {
        currentY += h;
        targetY += h;
      }
      // Teleport UP: user scrolled past originals into `before` → wrap to bottom.
      if (currentY > 0) {
        currentY -= h;
        targetY -= h;
      }
    }

    wrap.style.transform = `translate3d(0, ${Math.round(currentY)}px, 0)`;
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const onWheel = (e) => {
    e.preventDefault();
    if (paused) return;
    targetY -= e.deltaY * WHEEL_SPEED;
  };

  const onTouchStart = (e) => {
    if (paused) return;
    touching = true;
    touchLastY = e.touches[0].clientY;
    touchVel = 0;
    touchLastT = performance.now();
    velocity = 0;
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (paused) return;
    const y = e.touches[0].clientY;
    const now = performance.now();
    const dt = now - touchLastT || 1;
    const dy = (touchLastY - y) * TOUCH_SPEED;

    targetY -= dy;
    touchVel = (-dy / dt) * 16;
    touchLastY = y;
    touchLastT = now;
  };

  const onTouchEnd = () => {
    touching = false;
    velocity = touchVel * 12;
  };

  const ac = new AbortController();
  window.addEventListener("wheel", onWheel, {
    passive: false,
    signal: ac.signal,
  });
  window.addEventListener("touchstart", onTouchStart, {
    passive: true,
    signal: ac.signal,
  });
  window.addEventListener("touchmove", onTouchMove, {
    passive: false,
    signal: ac.signal,
  });
  window.addEventListener("touchend", onTouchEnd, { signal: ac.signal });

  infiniteStrip = {
    wrap,
    origList,
    clones: [before, after],
    start() {
      paused = false;
    },
    stop() {
      paused = true;
      velocity = 0;
      touching = false;
    },
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      ac.abort();
      before.remove();
      after.remove();
      wrap.style.transform = "";
      wrap.style.willChange = "";
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.touchAction = prev.bodyTouchAction;
    },
  };
}

function stopInfiniteStrip() {
  if (!infiniteStrip) return;
  infiniteStrip.destroy();
  infiniteStrip = null;
}

export function initHome({
  playSharedIntro = false,
  content = document,
  pageKey = "home",
} = {}) {
  const hasSharedIntro = !!document.querySelector(".intro");
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const homeList = utils.$(".home_list")[0];

  // Intro phase: lock scroll + park the list below the fold. The engine
  // starts later (after intro dismiss) so it doesn't fight the y animation.
  if (playSharedIntro && hasSharedIntro) {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (homeList) animate(homeList, { y: "100vh", duration: 0 });
  }

  const homeItems = getHomeListItems();
  if (homeItems.length) setHomeItemsBlurred(homeItems);

  if (!playSharedIntro) {
    const scrollThres = document.querySelector(".scroll-thres");
    if (scrollThres) scrollThres.remove();
    if (homeList) animate(homeList, { y: 0, duration: 0 });
    animate(".main", { opacity: 1, pointerEvents: "auto", duration: 0 });
    startInfiniteStrip();
    initScrollReveal(cubicEase);
  } else {
    // intro.js waits for the .home_list y-anim (400ms) to finish before
    // resolving, so by the time we hit this .then() the list is at y:0 and
    // safe to clone / translate.
    playSharedIntroIfPresent({ lenis: null, isHome: true }).then(() => {
      updateIntroForPage(pageKey);
      startInfiniteStrip();
      initScrollReveal(cubicEase);
    });
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
  scrollObservers.forEach((observer) => observer.revert());
  scrollObservers = [];

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
  document.body.style.touchAction = "";
  if (destroyGalleryZoom) {
    destroyGalleryZoom();
    destroyGalleryZoom = null;
  }
  stopInfiniteStrip();
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
