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

  (function () {
    /* ============================================================
     ZOOM VIEWER — Webflow CMS Gallery
     
     ON EACH COLLECTION LIST ITEM add these custom attributes:
       data-zoom-item        → empty, marks the clickable card
       
     ON THE <img> INSIDE each item:
       data-zoom-thumb       → empty, marks the thumbnail
       data-zoom-full        → bind to your CMS Image field URL
                               (script strips ?w= params automatically)
                               
     OPTIONAL text elements inside item (can be display:none):
       data-zoom-name        → bind to Name / Title field
       data-zoom-city        → bind to Location / City field
  ============================================================ */

    // ── Collect items from DOM ───────────────────────────────────
    const items = [...document.querySelectorAll("[data-zoom-item]")];
    if (!items.length) return;

    const images = items
      .map((item) => {
        const img =
          item.querySelector("[data-zoom-thumb]") || item.querySelector("img");
        const thumb = img?.src || "";

        // Strip Webflow's auto-added ?w= params to get the original upload
        const rawFull = img?.dataset.zoomFull || img?.src || thumb;
        const full = rawFull.split("?")[0];

        // Uncomment the line below to request a specific size instead:
        // const full = rawFull.split('?')[0] + '?w=2400&q=85';

        const name =
          item.querySelector("[data-zoom-name]")?.textContent.trim() || "";
        const city =
          item.querySelector("[data-zoom-city]")?.textContent.trim() || "";

        return { thumb, full, name, city };
      })
      .filter((i) => i.thumb);

    if (!images.length) return;

    // ── Grab premade Webflow elements ────────────────────────────
    const overlay = document.getElementById("zoom-overlay");
    const zoomWrap = document.getElementById("zoom-wrap");
    const elTitle = document.getElementById("zoom-title");
    const elClose = document.getElementById("zoom-close");
    const elCounter = document.getElementById("zoom-counter");
    const elHud = document.getElementById("zoom-hud");
    const elPrev = document.getElementById("zoom-prev");
    const elNext = document.getElementById("zoom-next");

    if (!overlay || !zoomWrap) {
      console.warn(
        "Zoom viewer: #zoom-overlay or #zoom-wrap not found in DOM.",
      );
      return;
    }

    // ── Inject the single <img> into zoom-wrap (once, on init) ───
    const fullImg = document.createElement("img");
    fullImg.id = "zoom-img";
    fullImg.style.cssText =
      "display:block;object-fit:contain;max-width:92vw;max-height:88vh;";
    zoomWrap.appendChild(fullImg);

    // ── Inject crosshair (lightweight, no Webflow element needed)
    const crosshair = document.createElement("div");
    crosshair.id = "zoom-crosshair";
    crosshair.style.cssText = `
    position:fixed;width:28px;height:28px;pointer-events:none;
    z-index:10001;opacity:0;transition:opacity .15s;
    transform:translate(-50%,-50%);
  `;
    crosshair.innerHTML = `
    <div style="position:absolute;width:1px;height:100%;left:50%;top:0;background:rgba(255,255,255,.55);"></div>
    <div style="position:absolute;height:1px;width:100%;top:50%;left:0;background:rgba(255,255,255,.55);"></div>
    <div style="position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.85);top:50%;left:50%;transform:translate(-50%,-50%);"></div>
  `;
    overlay.appendChild(crosshair);

    // ── Make each card clickable ─────────────────────────────────
    items.forEach((item, i) => {
      item.style.cursor = "zoom-in";
      item.addEventListener("click", () => openOverlay(i));
    });

    // ── State ────────────────────────────────────────────────────
    const ZOOM_SCALE = 2.8;
    let idx = 0,
      isZoomed = false,
      isMobile = false;
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

    function setHud() {
      if (!elHud) return;
      elHud.textContent = isZoomed
        ? isMobile
          ? "drag to pan · tap to zoom out"
          : "move to pan · click to zoom out"
        : isMobile
          ? "tap to zoom in"
          : "click to zoom in";
    }

    // ── Open / close ─────────────────────────────────────────────
    function openOverlay(i) {
      idx = i;
      loadImage(i);
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setHud();
    }

    function closeOverlay() {
      if (isZoomed) zoomOut(true);
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function loadImage(i) {
      if (isZoomed) zoomOut(true);
      const d = images[i];
      fullImg.src = d.full;
      if (elTitle)
        elTitle.textContent = [d.name, d.city].filter(Boolean).join(" — ");
      if (elCounter) elCounter.textContent = i + 1 + " / " + images.length;
      fullImg.style.width = "";
      fullImg.style.height = "";
      fullImg.style.maxWidth = "92vw";
      fullImg.style.maxHeight = "88vh";
      fullImg.style.transform = "translate(0,0)";
      curTx = 0;
      curTy = 0;
      naturalW = 0;
      naturalH = 0;
    }

    function navigate(dir) {
      idx = (idx + dir + images.length) % images.length;
      loadImage(idx);
      setHud();
    }

    // ── Size computation ──────────────────────────────────────────
    fullImg.addEventListener("load", () => {
      naturalW = fullImg.naturalWidth || 1600;
      naturalH = fullImg.naturalHeight || 1067;
      setBaseSize();
    });

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

    // ── Translate (clamped) ───────────────────────────────────────
    function applyTranslate(tx, ty) {
      const maxX = Math.max(0, (zoomedW - window.innerWidth) / 2);
      const maxY = Math.max(0, (zoomedH - window.innerHeight) / 2);
      curTx = Math.max(-maxX, Math.min(maxX, tx));
      curTy = Math.max(-maxY, Math.min(maxY, ty));
      fullImg.style.transform = `translate(${curTx}px,${curTy}px)`;
    }

    // ── Zoom in ───────────────────────────────────────────────────
    function zoomIn(cx, cy) {
      isZoomed = true;
      zoomWrap.style.cursor = "none";
      setHud();
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
      setTimeout(() => {
        fullImg.style.transition = "";
        if (!isMobile) crosshair.style.opacity = "1";
      }, 360);
    }

    // ── Zoom out ──────────────────────────────────────────────────
    function zoomOut(instant) {
      isZoomed = false;
      zoomWrap.style.cursor = "zoom-in";
      crosshair.style.opacity = "0";
      setHud();
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
    overlay.addEventListener("mousemove", (e) => {
      if (!isZoomed || isMobile) return;
      crosshair.style.left = e.clientX + "px";
      crosshair.style.top = e.clientY + "px";
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      applyTranslate(
        (-nx * (zoomedW - window.innerWidth)) / 2,
        (-ny * (zoomedH - window.innerHeight)) / 2,
      );
    });
    overlay.addEventListener(
      "mouseleave",
      () => (crosshair.style.opacity = "0"),
    );
    overlay.addEventListener("mouseenter", () => {
      if (isZoomed && !isMobile) crosshair.style.opacity = "1";
    });

    // Desktop click
    let mouseMoved = false;
    zoomWrap.addEventListener("mousedown", () => (mouseMoved = false));
    zoomWrap.addEventListener("mousemove", () => (mouseMoved = true));
    zoomWrap.addEventListener("click", (e) => {
      if (mouseMoved && isZoomed) return;
      isZoomed ? zoomOut(false) : zoomIn(e.clientX, e.clientY);
    });

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
      { passive: true },
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
      { passive: false },
    );

    zoomWrap.addEventListener(
      "touchend",
      () => {
        if (!tMoved) {
          isZoomed ? zoomOut(false) : zoomIn(tSX, tSY);
          return;
        }
        // Momentum flick
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
      { passive: true },
    );

    // Swipe left/right to navigate (when not zoomed)
    let swipeSX = 0;
    overlay.addEventListener(
      "touchstart",
      (e) => (swipeSX = e.touches[0].clientX),
      { passive: true },
    );
    overlay.addEventListener(
      "touchend",
      (e) => {
        if (isZoomed) return;
        const dx = e.changedTouches[0].clientX - swipeSX;
        if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
      },
      { passive: true },
    );

    // ── Controls ──────────────────────────────────────────────────
    elClose?.addEventListener("click", closeOverlay);
    elPrev?.addEventListener("click", () => navigate(-1));
    elNext?.addEventListener("click", () => navigate(1));

    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        isZoomed ? zoomOut(false) : closeOverlay();
      }
      if (e.key === "ArrowRight") navigate(1);
      if (e.key === "ArrowLeft") navigate(-1);
    });

    window.addEventListener("resize", () => {
      checkMobile();
      setBaseSize();
      setHud();
    });

    setHud();
  })();
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
