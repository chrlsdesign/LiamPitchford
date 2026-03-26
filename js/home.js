import { animate, cubicBezier, createLayout, onScroll } from "animejs";
import Lenis from "lenis";
import { playSharedIntroIfPresent } from "./intro.js";

let scrollObservers = [];
const played = new Set();
let lenis = null;
let destroyGalleryZoom = null;

export function initHome({ playSharedIntro = false } = {}) {
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

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => {
      initScrollReveal();
    });
  } else {
    initScrollReveal();
  }

  function initScrollReveal() {
    const originalList = document.querySelector(".home_list");
    if (!originalList) return;
    const items = originalList.querySelectorAll(".home_item");

    items.forEach((item, i) => {
      const isOdd = i % 2 === 0;

      const observer = onScroll({
        target: item,
        repeat: false,
        onEnter: () => {
          if (played.has(item)) return;
          played.add(item);
          animate(item, {
            filter: ["blur(20px)", "blur(0px)"],
            duration: 750,
            ease: cubicEase,
          });
        },
        onEnterBackward: () => {
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

  /* Gallery Zoom */
  destroyGalleryZoom = initGalleryZoom();
}

function initGalleryZoom() {
  const allItems = [...document.querySelectorAll("[data-zoom-item]")];
  if (!allItems.length) return null;

  const items = [];
  const images = [];
  const thumbEls = [];

  allItems.forEach((item) => {
    const img =
      item.querySelector("[data-zoom-thumb]") || item.querySelector("img");
    if (!img?.src) return;
    const rawFull = img.dataset.zoomFull || img.src;
    const full = rawFull.split("?")[0];
    const i = items.length;
    items.push(item);
    images.push({ thumb: img.src, full });
    thumbEls.push(img);
    img.setAttribute("data-layout-id", `zoom-${i}`);
  });

  if (!images.length) return null;

  const overlay = document.getElementById("zoom-overlay");
  const zoomWrap = document.getElementById("zoom-wrap");
  const elClose = document.getElementById("zoom-close");
  const elPrev = document.getElementById("zoom-prev");
  const elNext = document.getElementById("zoom-next");
  if (!overlay || !zoomWrap) {
    console.warn("Zoom viewer: #zoom-overlay or #zoom-wrap not found in DOM.");
    return null;
  }

  const ac = new AbortController();
  const sig = ac.signal;

  let fullImg = zoomWrap.querySelector("#zoom-img");
  if (!fullImg) {
    fullImg = document.createElement("img");
    fullImg.id = "zoom-img";
    fullImg.style.cssText =
      "display:block;object-fit:contain;max-width:92vw;max-height:88vh;";
    zoomWrap.appendChild(fullImg);
  }

  const modalLayout = createLayout(overlay, {
    children: ["[data-zoom-thumb]", "[data-zoom-item] img", "#zoom-img"],
  });

  items.forEach((item, i) => {
    item.addEventListener("click", () => openOverlay(i), { signal: sig });
  });

  const ZOOM_SCALE = 2.8;
  let idx = 0,
    isZoomed = false,
    isMobile = false;
  let openItem = null;
  let naturalW = 0,
    naturalH = 0;
  let baseW = 0,
    baseH = 0,
    zoomedW = 0,
    zoomedH = 0;
  let curTx = 0,
    curTy = 0;

  function checkMobile() {
    isMobile =
      window.matchMedia("(hover:none) and (pointer:coarse)").matches ||
      "ontouchstart" in window;
  }
  checkMobile();

  function resetImgState() {
    fullImg.style.width = "";
    fullImg.style.height = "";
    fullImg.style.maxWidth = "75vw";
    fullImg.style.maxHeight = "80vh";
    fullImg.style.transform = "translate(0,0)";
    curTx = 0;
    curTy = 0;
    naturalW = 0;
    naturalH = 0;
  }

  function openOverlay(i) {
    idx = i;
    fullImg.src = images[i].thumb;
    fullImg.setAttribute("data-layout-id", `zoom-${i}`);
    openItem = items[i];

    modalLayout.update(
      () => {
        overlay.classList.add("is-open");
        openItem.style.visibility = "hidden";
      },
      { duration: 500, ease: "outQuint" },
    );

    fullImg.src = images[i].full;
    resetImgState();
    document.body.style.overflow = "hidden";
  }

  function closeOverlay() {
    if (isZoomed) zoomOut(true);

    modalLayout.update(
      () => {
        overlay.classList.remove("is-open");
        if (openItem) {
          openItem.style.visibility = "";
          openItem = null;
        }
      },
      { duration: 500, ease: "outQuint" },
    );

    fullImg.removeAttribute("data-layout-id");
    document.body.style.overflow = "";
  }

  function loadImage(i) {
    if (isZoomed) zoomOut(true);
    if (openItem) openItem.style.visibility = "";
    fullImg.src = images[i].full;
    fullImg.setAttribute("data-layout-id", `zoom-${i}`);
    openItem = items[i];
    openItem.style.visibility = "hidden";
    resetImgState();
  }

  function navigate(dir) {
    idx = (idx + dir + images.length) % images.length;
    loadImage(idx);
  }

  fullImg.addEventListener(
    "load",
    () => {
      naturalW = fullImg.naturalWidth || 1600;
      naturalH = fullImg.naturalHeight || 1067;
      setBaseSize();
    },
    { signal: sig },
  );

  function setBaseSize() {
    if (!naturalW) return;
    const vw = window.innerWidth * 0.92;
    const vh = window.innerHeight * 0.88;
    const r = naturalW / naturalH || 1.5;
    if (vw / vh > r) {
      baseH = vh;
      baseW = vh * r;
    } else {
      baseW = vw;
      baseH = vw / r;
    }
    zoomedW = baseW * ZOOM_SCALE;
    zoomedH = baseH * ZOOM_SCALE;
    if (!isZoomed) {
      fullImg.style.width = baseW + "px";
      fullImg.style.height = baseH + "px";
      fullImg.style.maxWidth = "none";
      fullImg.style.maxHeight = "none";
    }
  }

  function applyTranslate(tx, ty) {
    const maxX = Math.max(0, (zoomedW - window.innerWidth) / 2);
    const maxY = Math.max(0, (zoomedH - window.innerHeight) / 2);
    curTx = Math.max(-maxX, Math.min(maxX, tx));
    curTy = Math.max(-maxY, Math.min(maxY, ty));
    fullImg.style.transform = `translate(${curTx}px,${curTy}px)`;
  }

  function zoomIn(cx, cy) {
    isZoomed = true;
    zoomWrap.style.cursor = "none";
    fullImg.style.transition =
      "width .35s ease, height .35s ease, transform .35s ease";
    fullImg.style.width = zoomedW + "px";
    fullImg.style.height = zoomedH + "px";
    const rect = zoomWrap.getBoundingClientRect();
    const fx = (cx - rect.left) / baseW;
    const fy = (cy - rect.top) / baseH;
    applyTranslate(
      -(fx * zoomedW - window.innerWidth / 2),
      -(fy * zoomedH - window.innerHeight / 2),
    );
    setTimeout(() => (fullImg.style.transition = ""), 360);
  }

  function zoomOut(instant) {
    isZoomed = false;
    zoomWrap.style.cursor = "zoom-in";
    if (!instant)
      fullImg.style.transition =
        "width .35s ease, height .35s ease, transform .35s ease";
    fullImg.style.width = baseW + "px";
    fullImg.style.height = baseH + "px";
    fullImg.style.transform = "translate(0,0)";
    curTx = 0;
    curTy = 0;
    if (!instant) setTimeout(() => (fullImg.style.transition = ""), 360);
  }

  // ── Mouse pan (desktop) ───────────────────────────────────────
  overlay.addEventListener(
    "mousemove",
    (e) => {
      if (!isZoomed || isMobile) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      applyTranslate(
        (-nx * (zoomedW - window.innerWidth)) / 2,
        (-ny * (zoomedH - window.innerHeight)) / 2,
      );
    },
    { signal: sig },
  );
  // Desktop click
  let mouseMoved = false;
  zoomWrap.addEventListener("mousedown", () => (mouseMoved = false), {
    signal: sig,
  });
  zoomWrap.addEventListener("mousemove", () => (mouseMoved = true), {
    signal: sig,
  });
  zoomWrap.addEventListener(
    "click",
    (e) => {
      if (mouseMoved && isZoomed) return;
      isZoomed ? zoomOut(false) : zoomIn(e.clientX, e.clientY);
    },
    { signal: sig },
  );

  // ── Touch drag (mobile) ───────────────────────────────────────
  let tSX = 0,
    tSY = 0,
    tLX = 0,
    tLY = 0,
    tMoved = false;
  let vx = 0,
    vy = 0,
    tTime = 0,
    mRAF = null;

  zoomWrap.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      tSX = tLX = t.clientX;
      tSY = tLY = t.clientY;
      tMoved = false;
      vx = 0;
      vy = 0;
      if (mRAF) {
        cancelAnimationFrame(mRAF);
        mRAF = null;
      }
      tTime = Date.now();
    },
    { passive: true, signal: sig },
  );

  zoomWrap.addEventListener(
    "touchmove",
    (e) => {
      if (!isZoomed || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      const now = Date.now(),
        dt = Math.max(1, now - tTime);
      const dx = t.clientX - tLX,
        dy = t.clientY - tLY;
      vx = dx / dt;
      vy = dy / dt;
      tTime = now;
      if (Math.abs(t.clientX - tSX) > 6 || Math.abs(t.clientY - tSY) > 6)
        tMoved = true;
      applyTranslate(curTx + dx, curTy + dy);
      tLX = t.clientX;
      tLY = t.clientY;
    },
    { passive: false, signal: sig },
  );

  zoomWrap.addEventListener(
    "touchend",
    () => {
      if (!tMoved) {
        isZoomed ? zoomOut(false) : zoomIn(tSX, tSY);
        return;
      }
      if (isZoomed && (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05)) {
        const friction = 0.88;
        const step = () => {
          if (!isZoomed) return;
          vx *= friction;
          vy *= friction;
          if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;
          applyTranslate(curTx + vx * 16, curTy + vy * 16);
          mRAF = requestAnimationFrame(step);
        };
        mRAF = requestAnimationFrame(step);
      }
    },
    { passive: true, signal: sig },
  );

  // Swipe left/right to navigate (when not zoomed)
  let swipeSX = 0;
  overlay.addEventListener(
    "touchstart",
    (e) => (swipeSX = e.touches[0].clientX),
    { passive: true, signal: sig },
  );
  overlay.addEventListener(
    "touchend",
    (e) => {
      if (isZoomed) return;
      const dx = e.changedTouches[0].clientX - swipeSX;
      if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
    },
    { passive: true, signal: sig },
  );

  // ── Controls ──────────────────────────────────────────────────
  elClose?.addEventListener("click", closeOverlay, { signal: sig });
  elPrev?.addEventListener("click", () => navigate(-1), { signal: sig });
  elNext?.addEventListener("click", () => navigate(1), { signal: sig });

  document.addEventListener(
    "keydown",
    (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        isZoomed ? zoomOut(false) : closeOverlay();
      }
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    },
    { signal: sig },
  );

  window.addEventListener(
    "resize",
    () => {
      checkMobile();
      setBaseSize();
    },
    { signal: sig },
  );

  return () => {
    closeOverlay();
    ac.abort();
    if (mRAF) cancelAnimationFrame(mRAF);
    fullImg.remove();
    modalLayout.revert();
    thumbEls.forEach((el) => el.removeAttribute("data-layout-id"));
  };
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
  if (destroyGalleryZoom) {
    destroyGalleryZoom();
    destroyGalleryZoom = null;
  }
  lenis.destroy();
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
