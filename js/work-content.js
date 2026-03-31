import { animate, createTimeline, splitText, stagger, utils } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const WORK_CONTENT_WORD_CLASSES = [".content_title"];
const WORK_CONTENT_LINE_CLASSES = [".content_desc p"];

function collectWorkContentSplits() {
  const spduration = 1000;
  const wordStagger = 10;
  const lineStagger = 80;
  const blocks = [];

  WORK_CONTENT_WORD_CLASSES.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      blocks.push({ targets: split.words, spduration, spstagger: wordStagger });
    });
  });

  WORK_CONTENT_LINE_CLASSES.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { lines: { wrap: "clip" } });
      blocks.push({ targets: split.lines, spduration, spstagger: lineStagger });
    });
  });

  return blocks;
}

function setWorkContentHidden(blocks) {
  blocks.forEach(({ targets }) => {
    animate(targets, { y: "100%", duration: 0 });
  });
}

function runWorkContentPageIntro(blocks) {
  const wc_tl = createTimeline();

  blocks.forEach(({ targets, spduration, spstagger }) => {
    wc_tl.add(
      targets,
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
  const blocks = collectWorkContentSplits();
  setWorkContentHidden(blocks);

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
