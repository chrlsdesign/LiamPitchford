import {
  animate,
  cubicBezier,
  createLayout,
  createAnimatable,
  utils,
  createTimeline,
} from "animejs";
import {
  detachIntroInterListeners,
  playSharedIntroIfPresent,
  updateIntroForPage,
} from "./intro.js";
import { createPageScope } from "./scope.js";

let scrollObservers = [];
const played = new Set();
/** Maps every `.home_item` (original + clone) to its 2-copy group, so a
 * reveal on either copy marks the other as played (no re-animation on loop). */
const itemGroups = new WeakMap();
let destroyGalleryZoom = null;
let infiniteStrip = null;
let homeScope = null;

const HOME_ITEM_BLUR_START = "blur(20px)";
const HOME_ITEM_BLUR_END = "blur(0px)";
const HOME_LIST_MODAL_BLUR = "blur(12px)";

function syncVisibleHomeVideos() {
  const wrap = document.querySelector(".home_content--wrap");
  if (!wrap) return;

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  wrap.querySelectorAll("video").forEach((video) => {
    const r = video.getBoundingClientRect();
    const visible =
      r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    if (visible) video.play().catch(() => {});
    else video.pause();
  });
}

function lockModalScroll() {
  if (infiniteStrip) infiniteStrip.stop();
  pauseHomeVideos();
}

function unlockModalScroll() {
  if (infiniteStrip) infiniteStrip.start();
  syncVisibleHomeVideos();
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
    utils.set(item, { filter: HOME_ITEM_BLUR_START });
  });
}

/**
 * IntersectionObserver-based reveal. `onScroll` from anime.js can't see the
 * strip because the window never scrolls — the wrap is transformed instead —
 * so we watch real screen bounds, which update naturally with transforms.
 * All items across the original list and the clone are observed so each
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
          // Filter is cleared (not left at blur(0px)) once done — a no-op blur
          // still keeps the element on the expensive filtered raster path.
          if (el === item) {
            animate(el, {
              filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
              duration: 750,
              ease: cubicEase,
              onComplete: () => {
                el.style.filter = "";
              },
            });
          } else {
            el.style.filter = "";
          }
        });
      }
    },
    { threshold: 0.01 },
  );

  items.forEach((item) => io.observe(item));
  scrollObservers.push({ revert: () => io.disconnect() });
}

function pauseHomeVideos() {
  const wrap = document.querySelector(".home_content--wrap");
  wrap?.querySelectorAll("video").forEach((video) => {
    video.pause();
    video.playsInline = true;
    // Playback is owned exclusively by the IO in `initHomeVideoPlayback`.
    // `preload="none"` means no fetch/decode happens at all until a video is
    // actually about to enter the viewport (play() triggers the load) — so
    // only the handful of visible videos ever hold a decoder, instead of
    // every copy of every video warming one up during the intro.
    video.preload = "none";
    video.removeAttribute("autoplay");
  });
}

/**
 * Pause strip videos by default; play only while visible in the viewport.
 * Uses IO (not onScroll) — same reason as `initScrollReveal`: the wrap is
 * transformed, so window scroll observers never see movement.
 */
function initHomeVideoPlayback() {
  const wrap = document.querySelector(".home_content--wrap");
  if (!wrap) return;

  const videos = wrap.querySelectorAll("video");
  if (!videos.length) return;

  pauseHomeVideos();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    // rootMargin pre-rolls playback slightly before entry so the play()
    // spin-up isn't visible during fast flings.
    { threshold: 0.1, rootMargin: "25%" },
  );

  videos.forEach((video) => io.observe(video));
  scrollObservers.push({
    revert: () => {
      io.disconnect();
      videos.forEach((video) => video.pause());
    },
  });
}

function attachLinkCursor(link) {
  const crs = link.querySelector(".home_flw--crs");
  if (!crs) return () => {};

  const cursorAnim = createAnimatable(crs, {
    x: 200,
    y: 200,
    ease: "out(3)",
  });

  const onMove = (e) => {
    const { width, height, left, top } = link.getBoundingClientRect();
    const hw = width / 2;
    const hh = height / 2;
    const x = utils.clamp(e.clientX - left - hw, -hw, hw);
    const y = utils.clamp(e.clientY - top - hh, -hh, hh);
    cursorAnim.x(x).y(y);
  };

  const onEnter = () => {
    animate(crs, { opacity: 1, duration: 800, ease: "inOut(1.68)" });
  };

  const onLeave = () => {
    animate(crs, { opacity: 0, duration: 800, ease: "inOut(1.68)" });
  };

  link.addEventListener("mousemove", onMove);
  link.addEventListener("mouseenter", onEnter);
  link.addEventListener("mouseleave", onLeave);

  return () => {
    link.removeEventListener("mousemove", onMove);
    link.removeEventListener("mouseenter", onEnter);
    link.removeEventListener("mouseleave", onLeave);
  };
}

function setupDesktopLinkCursors() {
  const cleanups = [];
  document.querySelectorAll(".home_cms--link").forEach((link) => {
    cleanups.push(attachLinkCursor(link));
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * Render-skip clone items that are off-screen. `content-visibility: auto`
 * makes the browser skip layout/paint/raster for items outside the viewport
 * (it accounts for the strip's transform), so the clone copy costs ~nothing.
 * The first viewport-worth of clone items is exempted via an inline override
 * in `syncCloneIntrinsicSizes` — they're the teleport landing zone and must
 * be pre-painted to avoid a flash at the loop seam. Originals are NOT skipped
 * — they stay fully rendered so their measured heights can feed the clone
 * placeholders.
 */
const STRIP_CLONE_CSS = `
  .home_list.is-clone .home_item {
    content-visibility: auto;
    contain-intrinsic-size: auto 480px;
  }
`;

function injectStripCloneStyles() {
  if (document.querySelector("style[data-strip-clone-styles]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-strip-clone-styles", "");
  style.textContent = STRIP_CLONE_CSS;
  document.head.appendChild(style);
}

/**
 * Copy each original item's real height onto its clone twin as
 * `contain-intrinsic-size`, so skipped clone items occupy their exact final
 * size. Same width → same height, which means the strip's total height never
 * shifts when a clone item renders in — no layout jumps at the loop seam.
 *
 * Seam pre-render: the engine keeps currentY within [-h, 0], so the only part
 * of the clone that can EVER appear on screen is its first viewport-height
 * (shown right after the up-teleport and when scrolling down across the
 * seam). Those items are forced to `content-visibility: visible` so they're
 * already painted the instant the teleport lands on them — render-skipping
 * them is what caused the flicker when scrolling up past the loop point.
 * Deeper clone items are never visible at all and stay fully skipped.
 */
function syncCloneIntrinsicSizes() {
  const origItems = document.querySelectorAll(
    ".home_list:not(.is-clone) .home_item",
  );
  const cloneItems = document.querySelectorAll(
    ".home_list.is-clone .home_item",
  );
  if (!cloneItems.length) return;

  // 1.5x viewport of headroom so fast flings can't outrun the painted region.
  const preRenderBudget = window.innerHeight * 1.5;
  let cumulative = 0;

  origItems.forEach((item, i) => {
    const cloneItem = cloneItems[i];
    if (!cloneItem) return;
    const h = item.offsetHeight;
    if (h > 0) {
      cloneItem.style.containIntrinsicSize = `auto ${h}px`;
    }
    cloneItem.style.contentVisibility =
      cumulative < preRenderBudget ? "visible" : "";
    cumulative += h;
  });
}

/**
 * Clone the original `.home_list` ONCE (appended after the original) and pair
 * items by index. A single clone is enough for the infinite loop: the strip is
 * `[original=h][clone=h]` and the engine wraps currentY within [-h, 0], so the
 * viewport is always covered as long as the list is taller than the viewport.
 * Halving the duplicated DOM (vs the old before+after clones) cuts node count,
 * image/video decode pressure, and paint cost by a third.
 * Safe to call multiple times — only runs if the clone doesn't already exist.
 * Must run before `startInfiniteStrip` (and can run before the intro dismiss
 * so the intro timeline can target `.home_list.is-clone`).
 */
function insertStripClones() {
  const wrap = document.querySelector(".home_content--wrap");
  const origList = document.querySelector(".home_list:not(.is-clone)");
  if (!wrap || !origList) return;
  if (wrap.querySelector(".home_list.is-clone")) return;

  const clone = origList.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.classList.add("is-clone");
  // `cloneNode(true)` copies the blurred inline `filter` from each original
  // item (set in `setHomeItemsBlurred`), so clone items start blurred and
  // reveal on their own as they scroll into view.
  wrap.appendChild(clone);

  // Pair each item with its clone by index so the reveal observer can treat
  // both copies as one — revealing either copy marks the other played.
  const origItems = [...origList.querySelectorAll(".home_item")];
  const cloneItems = [...clone.querySelectorAll(".home_item")];
  origItems.forEach((item, i) => {
    const group = [item, cloneItems[i]].filter(Boolean);
    group.forEach((el) => itemGroups.set(el, group));
  });

  injectStripCloneStyles();
  syncCloneIntrinsicSizes();
  pauseHomeVideos();
}

function startInfiniteStrip() {
  if (infiniteStrip) return;
  const wrap = document.querySelector(".home_content--wrap");
  const origList = document.querySelector(".home_list:not(.is-clone)");
  if (!wrap || !origList) return;

  // Make sure the clone is in place (no-op if `insertStripClones` already ran).
  insertStripClones();

  const clone = wrap.querySelector(".home_list.is-clone");

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

  // Strip layout is now `[original][clone]`, so the resting position is y: 0
  // (original at the top). Set it synchronously: the critical CSS in <head>
  // parks `.home_content--wrap` at translateY(100vh), and this write is what
  // overrides it — without it the strip would stay off-screen.
  wrap.style.transform = "translate3d(0, 0, 0)";

  const initH = origList.offsetHeight;

  let currentY = 0;
  let targetY = 0;
  let lastWrittenY = 0;
  let velocity = 0;
  // Only mark initialized if the height read produced a real value. Otherwise
  // let the rAF safety net below pick up the real height on the next frame.
  let initialized = initH > 0;
  let running = true;
  let paused = false;

  let touching = false;
  let touchLastY = 0;
  let touchProcessedY = 0;
  let touchVel = 0;
  let touchLastT = 0;

  // Cache the list height — reading `offsetHeight` inside the rAF loop forces
  // a layout every frame. The height only changes on resize/content load, so
  // a ResizeObserver keeps the cache fresh instead. Clone placeholder sizes
  // are re-synced at the same time (they depend on original item heights).
  let cachedH = initH;
  const ro = new ResizeObserver(() => {
    cachedH = origList.offsetHeight;
    syncCloneIntrinsicSizes();
  });
  ro.observe(origList);

  let rafId = 0;
  const tick = () => {
    if (!running) return;

    // Safety net: if `offsetHeight` was 0 at setup time (e.g. wrap was
    // hidden), pick up the real height as soon as it's available. The resting
    // position is y: 0 regardless of height, so only the cache needs fixing.
    if (!initialized) {
      cachedH = origList.offsetHeight;
      initialized = cachedH > 0;
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

      // Idle short-circuit: at rest there's nothing to animate — snap once,
      // then skip the easing math and transform writes so the compositor
      // isn't fed redundant updates every frame while the strip sits still.
      const settled =
        !touching && velocity === 0 && Math.abs(targetY - currentY) < 0.1;

      if (settled) {
        currentY = targetY;
      } else {
        currentY += (targetY - currentY) * FRICTION;
      }

      const h = cachedH;
      // Strip layout: [original=h][clone=h] — keep currentY within [-h, 0].
      // The wrap MUST run on every path that can move currentY (including the
      // settled snap above) or the strip can park outside the covered range
      // and show blank space above the original.
      // Teleport DOWN: scrolled past the original into the clone → wrap back.
      if (h > 0 && currentY < -h) {
        currentY += h;
        targetY += h;
      }
      // Teleport UP: scrolled above the original → wrap forward into the clone.
      if (h > 0 && currentY > 0) {
        currentY -= h;
        targetY -= h;
      }

      // Only touch the DOM when the rounded position actually changed.
      const rounded = Math.round(currentY);
      if (rounded !== lastWrittenY) {
        lastWrittenY = rounded;
        wrap.style.transform = `translate3d(0, ${rounded}px, 0)`;
      }
    }

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
    clones: [clone],
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
      ro.disconnect();
      ac.abort();
      clone?.remove();
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
  homeScope?.revert();
  homeScope = createPageScope(content);

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

    // Get the strip's clone in place and the wrap parked at y: 0 synchronously
    // so the page is laid out correctly even while it's masked by opacity:0.
    const wrap = document.querySelector(".home_content--wrap");
    if (wrap) {
      wrap.style.opacity = "0";
      wrap.style.filter = HOME_ITEM_BLUR_START;
    }

    startInfiniteStrip();
    initHomeVideoPlayback();
    animate(".home_list.is-clone", { opacity: 1, duration: 0 });

    // Flower animates immediately; content reveal waits for the intro lead
    // so the flower visibly moves before the strip materializes.
    updateIntroForPage(pageKey).then(() => {
      if (wrap) {
        animate(wrap, {
          opacity: [0, 1],
          filter: [HOME_ITEM_BLUR_START, HOME_ITEM_BLUR_END],
          duration: 600,
          ease: cubicEase,
          onComplete: () => {
            wrap.style.filter = "";
          },
        });
      }
      initScrollReveal(cubicEase);
    });
  } else {
    playSharedIntroIfPresent({ isHome: true })
      .then(() => updateIntroForPage(pageKey))
      .then(() => {
        startInfiniteStrip();
        initHomeVideoPlayback();
        initScrollReveal(cubicEase);
      });
  }

  homeScope.add((scope) => {
    if (!scope.matches.desktop) return;
    return setupDesktopLinkCursors();
  });

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
        onComplete: () => {
          homeList.style.filter = "";
          unlockModalScroll();
        },
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
  homeScope?.revert();
  homeScope = null;
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
  played.clear();
  // `resetScrollReveal` reverts the observers and re-applies the clip-path
  // initial state on all remaining items (clones are already removed above).
  resetScrollReveal();
}
