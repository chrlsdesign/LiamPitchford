import {
  animate,
  cubicBezier,
  createLayout,
  onScroll,
  utils,
  createTimeline,
} from "animejs";
import {
  detachIntroInterListeners,
  playSharedIntroIfPresent,
  updateIntroForPage,
} from "./intro.js";

let scrollObservers = [];
const played = new Set();
/** Maps every `.home_item` (original + both clones) to its 3-copy group, so a
 * reveal on any copy marks the other two as played (no re-animation on loop). */
const itemGroups = new WeakMap();
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
 * All items across the original list and both clones are observed so each
 * instance reveals independently when it enters the viewport.
 */
function initScrollReveal(cubicEase) {
  const wrap = document.querySelector(".home_content--wrap");
  if (!wrap) return;
  const items = wrap.querySelectorAll(".home_item");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = entry.target;
        if (played.has(item)) {
          io.unobserve(item);
          continue;
        }

        const group = itemGroups.get(item) || [item];
        group.forEach((el) => {
          played.add(el);
          io.unobserve(el);
          // Only the intersecting copy animates; the off-screen siblings jump
          // straight to the cleared state so the user never sees them re-reveal.
          if (el === item) {
            animate(el, {
              filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
              duration: 750,
              ease: cubicEase,
            });
          } else {
            el.style.filter = HOME_ITEM_BLUR_END;
          }
        });
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
 * Clone the original `.home_list` once (before + after) and pair items by
 * index. Safe to call multiple times — only runs if clones don't already
 * exist. Must run before `startInfiniteStrip` (and can run before the intro
 * dismiss so the intro timeline can target `.home_list.is-clone`).
 */
function insertStripClones() {
  const wrap = document.querySelector(".home_content--wrap");
  const origList = document.querySelector(".home_list:not(.is-clone)");
  if (!wrap || !origList) return;
  if (wrap.querySelector(".home_list.is-clone")) return;

  const makeClone = () => {
    const c = origList.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.classList.add("is-clone");
    // `cloneNode(true)` copies the blurred inline `filter` from each original
    // item (set in `setHomeItemsBlurred`), so clones start blurred and reveal
    // on their own as they scroll into view.
    return c;
  };

  const before = makeClone();
  const after = makeClone();
  wrap.insertBefore(before, origList);
  wrap.appendChild(after);

  [before, after].forEach((list) => {
    list.querySelectorAll(".home_cms--link").forEach(attachLinkCursor);
  });

  // Pair each item with its clones by index so the reveal observer can treat
  // all three copies as one — revealing any copy marks the others played.
  const origItems = [...origList.querySelectorAll(".home_item")];
  const beforeItems = [...before.querySelectorAll(".home_item")];
  const afterItems = [...after.querySelectorAll(".home_item")];
  origItems.forEach((item, i) => {
    const group = [item, beforeItems[i], afterItems[i]].filter(Boolean);
    group.forEach((el) => itemGroups.set(el, group));
  });
}

function startInfiniteStrip() {
  if (infiniteStrip) return;
  const wrap = document.querySelector(".home_content--wrap");
  const origList = document.querySelector(".home_list:not(.is-clone)");
  if (!wrap || !origList) return;

  // Make sure clones are in place (no-op if `insertStripClones` already ran).
  insertStripClones();

  const before = wrap.querySelectorAll(".home_list.is-clone")[0];
  const after = wrap.querySelectorAll(".home_list.is-clone")[1];

  origList.style.transform = "";
  wrap.style.willChange = "transform";

  // Kill native scroll + pinch/scroll gestures — engine owns all vertical input.
  // `destroyHome` is the single owner of restoring these when leaving the page,
  // so the engine doesn't snapshot/restore them here.
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  // Tablet & below feel snappier with more momentum decay + stiffer pull.
  // Desktop keeps the original glidier feel.
  const MOBILE_MQ = window.matchMedia("(max-width: 991px)");
  let MOMENTUM = MOBILE_MQ.matches ? 0.85 : 0.92;
  let FRICTION = MOBILE_MQ.matches ? 0.12 : 0.075;
  const WHEEL_SPEED = 0.8;
  const TOUCH_SPEED = 1.0;

  let currentY = 0;
  let targetY = 0;
  let velocity = 0;
  let initialized = false;
  let running = true;
  let paused = false;

  let touching = false;
  let touchLastY = 0;
  let touchProcessedY = 0;
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
      if (touching) {
        // Consume any touchmove samples that arrived since the last frame in
        // one pass — keeps the touchmove handler itself near-empty.
        if (touchLastY !== touchProcessedY) {
          const now = performance.now();
          const dt = now - touchLastT || 16;
          const dy = (touchProcessedY - touchLastY) * TOUCH_SPEED;
          targetY -= dy;
          touchVel = (-dy / dt) * 16;
          touchProcessedY = touchLastY;
          touchLastT = now;
        }
      } else {
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
    const y = e.touches[0].clientY;
    touchLastY = y;
    touchProcessedY = y;
    touchVel = 0;
    touchLastT = performance.now();
    velocity = 0;
  };

  // Hot path — keep this as cheap as possible. All deltas/velocity math
  // happens in tick() so multiple events per frame collapse into one update.
  const onTouchMove = (e) => {
    e.preventDefault();
    if (paused) return;
    touchLastY = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    touching = false;
    velocity = touchVel * 1.1;
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

  const onBreakpointChange = (e) => {
    MOMENTUM = e.matches ? 0.85 : 0.92;
    FRICTION = e.matches ? 0.12 : 0.075;
  };
  MOBILE_MQ.addEventListener("change", onBreakpointChange, {
    signal: ac.signal,
  });

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
  const homeWrap = document.querySelector(".home_wrap");

  const homeItems = getHomeListItems();
  if (homeItems.length) setHomeItemsBlurred(homeItems);

  if (playSharedIntro && hasSharedIntro) {
    // Lock the page while the intro is on screen and park the whole home
    // block off-screen. `intro.js` slides `.home_wrap` back up during dismiss.
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (homeWrap) animate(homeWrap, { y: "100vh", duration: 0 });
    // Clones need to exist BEFORE the intro dismiss timeline runs so it can
    // target `.home_list.is-clone` (engine starts later, after dismiss).
    insertStripClones();
  }

  if (!playSharedIntro) {
    if (homeWrap) animate(homeWrap, { y: 0, duration: 0 });
    animate(".main", { opacity: 1, pointerEvents: "auto", duration: 0 });
    startInfiniteStrip();
    animate(".home_list.is-clone", { opacity: 1, duration: 0 });
    initScrollReveal(cubicEase);
  } else {
    playSharedIntroIfPresent({ isHome: true }).then(() => {
      updateIntroForPage(pageKey);
      startInfiniteStrip();
      initScrollReveal(cubicEase);
    });
  }

  document.querySelectorAll(".home_cms--link").forEach(attachLinkCursor);

  initDialog();
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
    const duration = lastModalListDuration;
    let $item;
    if (homeList) {
      animate(homeList, {
        opacity: 1,
        filter: HOME_ITEM_BLUR_END,
        duration,
        ease: cubicEase,
        onComplete: () => unlockModalScroll(),
      });
    }
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
  if (destroyGalleryZoom) {
    destroyGalleryZoom();
    destroyGalleryZoom = null;
  }
  // Tear the strip down first, then clear the page-level locks, so nothing
  // writes overflow/touch-action back on after us.
  stopInfiniteStrip();
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
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
