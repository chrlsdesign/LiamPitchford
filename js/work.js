import { animate, createTimeline, splitText, stagger, utils } from "animejs";
import { playSharedIntroIfPresent, updateIntroForPage } from "./intro.js";

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
    animate(split.words, { y: "100%", duration: 0 });
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

export function initWork({
  playSharedIntro = false,
  content = document,
  pageKey = "work",
} = {}) {
  const blocks = collectWorkWordSplits(content);
  setWorkWordsHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent()
      .then(() => updateIntroForPage(pageKey))
      .then(() => runWorkPageIntro(blocks));
  } else {
    updateIntroForPage(pageKey).then(() => runWorkPageIntro(blocks));
  }

  const controller = new AbortController();
  const { signal } = controller;
  const workItems = content.querySelectorAll(".work_item");
  let activeItem = null;

  //Hover Project
  workItems.forEach((item) => {
    item.querySelector(".work_title")?.classList.remove("is-active");
    const link = item.querySelector(".work_thumb--holder");
    const thumbs = item.querySelectorAll(".work_thumb");
    if (link) link.style.display = "none";
    thumbs.forEach((thumb) => (thumb.style.opacity = "0"));
  });

  workItems.forEach((item) => {
    item.addEventListener(
      "mouseover",
      () => {
        if (item.classList.contains("off")) return;
        if (item === activeItem) return;

        // deactivate previous
        if (activeItem) {
          activeItem
            .querySelector(".work_title")
            ?.classList.remove("is-active");
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
          workItems.forEach((wi) => {
            if (wi === item || wi.classList.contains("off")) return;
            animate(wi.querySelector(".work_title"), {
              opacity: 0.4,
              duration: 300,
              ease: "outQuad",
            });
          });
        }

        // activate current
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
        animate(
          item.querySelectorAll(".work_thumb"),
          {
            opacity: 1,
            filter: ["blur(20px)", "blur(0px)"],
            duration: 300,
            ease: "outQuad",
          },
          "<",
        );

        activeItem = item;
      },
      { signal },
    );
  });
}
