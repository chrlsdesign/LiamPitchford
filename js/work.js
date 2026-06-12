import { animate, createTimeline, splitText, stagger, utils } from "animejs";
import { playSharedIntroIfPresent, updateIntroForPage } from "./intro.js";
import { createPageScope } from "./scope.js";

let workScope = null;

const WORK_INTRO_CLASSES = [".work_title"];

function collectWorkWordSplits(container) {
  const spduration = 1000;
  const spstagger = 10;
  const blocks = [];
  const root = container.querySelector(".work_title") ? container : document;

  WORK_INTRO_CLASSES.forEach((cls) => {
    root.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      blocks.push({ split, spduration, spstagger });
    });
  });

  return blocks;
}

function setWorkWordsHidden(blocks) {
  blocks.forEach(({ split }) => {
    utils.set(split.words, { y: "100%" });
  });
}

function runWorkPageIntro(blocks) {
  const wr_tl = createTimeline();

  blocks.forEach(({ split, spduration, spstagger }) => {
    wr_tl.add(
      split.words,
      {
        y: ["100%", "0%"],
        duration: spduration,
        ease: "out(3)",
        delay: stagger(spstagger, { start: 0 }),
      },
      0,
    );
  });

  wr_tl.init();
}

function resetWorkHoverState(workItems) {
  workItems.forEach((item) => {
    item.querySelector(".work_title")?.classList.remove("is-active");
    const link = item.querySelector(".work_thumb--holder");
    const thumbs = item.querySelectorAll(".work_thumb");
    if (link) link.style.display = "none";
    thumbs.forEach((thumb) => (thumb.style.opacity = "0"));
  });
}

function showWorkThumbsStatic(workItems) {
  workItems.forEach((item) => {
    const link = item.querySelector(".work_thumb--holder");
    if (link) link.style.display = "flex";
    item.querySelectorAll(".work_thumb").forEach((thumb) => {
      thumb.style.opacity = "1";
      // Clear rather than blur(0px) — a no-op blur still costs at paint time.
      thumb.style.filter = "";
    });
  });
}

function setupWorkHover(workItems) {
  const items = Array.from(workItems);
  let activeItem = null;
  const cleanups = [];

  for (const item of items) {
    const onOver = () => {
      if (item.classList.contains("off")) return;
      if (item === activeItem) return;

      if (activeItem) {
        activeItem.querySelector(".work_title")?.classList.remove("is-active");
        animate(activeItem.querySelector(".work_title"), {
          opacity: 0.4,
          duration: 300,
          ease: "outQuad",
        });
        animate(activeItem.querySelectorAll(".work_thumb"), {
          opacity: 0,
          filter: ["blur(0px)", "blur(20px)"],
          duration: 300,
          ease: "outQuad",
        });
        animate(
          activeItem.querySelector(".work_thumb--holder"),
          {
            display: "none",
            duration: 0,
          },
          "<",
        );
      } else {
        items.forEach((wi) => {
          if (wi === item || wi.classList.contains("off")) return;
          animate(wi.querySelector(".work_title"), {
            opacity: 0.4,
            duration: 300,
            ease: "outQuad",
          });
        });
      }

      item.querySelector(".work_title")?.classList.add("is-active");
      animate(item.querySelector(".work_title"), {
        opacity: 1,
        duration: 300,
        ease: "outQuad",
      });
      animate(item.querySelector(".work_thumb--holder"), {
        display: "flex",
        duration: 0,
      });
      const thumbs = item.querySelectorAll(".work_thumb");
      animate(
        thumbs,
        {
          opacity: 1,
          filter: ["blur(20px)", "blur(0px)"],
          duration: 300,
          ease: "outQuad",
          onComplete: () => {
            thumbs.forEach((thumb) => (thumb.style.filter = ""));
          },
        },
        "<",
      );

      activeItem = item;
    };

    item.addEventListener("mouseover", onOver);
    cleanups.push(() => item.removeEventListener("mouseover", onOver));
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}

export function destroyWork() {
  workScope?.revert();
  workScope = null;
}

export function initWork({
  playSharedIntro = false,
  content = document,
  pageKey = "work",
} = {}) {
  workScope?.revert();
  workScope = createPageScope(content);

  const blocks = collectWorkWordSplits(content);
  setWorkWordsHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent()
      .then(() => updateIntroForPage(pageKey))
      .then(() => runWorkPageIntro(blocks));
  } else {
    updateIntroForPage(pageKey).then(() => runWorkPageIntro(blocks));
  }

  workScope.add((scope) => {
    const workItems = Array.from(
      scope.root.querySelectorAll(".work_item"),
    );
    if (!workItems.length) return;

    if (scope.matches.desktop) {
      resetWorkHoverState(workItems);
      return setupWorkHover(workItems);
    }

    showWorkThumbsStatic(workItems);
  });
}
