import { animate, createTimeline, splitText, stagger, utils } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const WORK_CONTENT_INTRO_CLASSES = [".content_title", ".content_desc p"];

let activeSplits = [];

function collectWorkContentWordSplits() {
  activeSplits.forEach((s) => s.revert());
  activeSplits = [];

  const spduration = 1000;
  const spstagger = 10;
  const blocks = [];

  WORK_CONTENT_INTRO_CLASSES.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      activeSplits.push(split);
      blocks.push({ split, spduration, spstagger });
    });
  });

  return blocks;
}

export function destroyWorkContent() {
  activeSplits.forEach((s) => s.revert());
  activeSplits = [];
}

function setWorkContentWordsHidden(blocks) {
  blocks.forEach(({ split }) => {
    animate(split.words, { y: "100%", duration: 0 });
  });
}

function runWorkContentPageIntro(blocks) {
  const wc_tl = createTimeline();

  blocks.forEach(({ split, spduration, spstagger }) => {
    wc_tl.add(
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

  wc_tl.init();
}

export function initWorkContent({ playSharedIntro = false } = {}) {
  const blocks = collectWorkContentWordSplits();
  setWorkContentWordsHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runWorkContentPageIntro(blocks));
  } else {
    runWorkContentPageIntro(blocks);
  }

  const items = document.querySelectorAll(
    ".content_next--list .content_next--item",
  );
  const total = items.length;

  items.forEach((item, i) => {
    const href = item.querySelector("a").getAttribute("href");

    if (window.location.pathname === href) {
      const nextItem = items[(i + 1) % total];
      nextItem.style.display = "block";
    }
  });

  document.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
  });
}
