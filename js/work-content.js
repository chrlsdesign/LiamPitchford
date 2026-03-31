import { animate, createTimeline, cubicBezier, onScroll, splitText, stagger } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const WORK_CONTENT_WORD_CLASSES = [".content_title"];
const WORK_CONTENT_LINE_CLASSES = [".content_desc p"];

function collectWorkContentSplits(container) {
  const spduration = 1000;
  const wordStagger = 10;
  const lineStagger = 80;
  const blocks = [];

  WORK_CONTENT_WORD_CLASSES.forEach((cls) => {
    container.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      blocks.push({ targets: split.words, spduration, spstagger: wordStagger });
    });
  });

  WORK_CONTENT_LINE_CLASSES.forEach((cls) => {
    container.querySelectorAll(cls).forEach((el) => {
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

const BLUR_START = "blur(20px)";
const BLUR_END = "blur(0px)";

let scrollObservers = [];
const played = new Set();

function initMediaBlurReveal(container) {
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const mediaEls = container.querySelectorAll("img:not(.content_next--list img), video:not(.content_next--list video)");

  mediaEls.forEach((el) => {
    animate(el, { filter: BLUR_START, duration: 0 });

    const observer = onScroll({
      target: el,
      repeat: false,
      onEnter: () => {
        if (played.has(el)) return;
        played.add(el);
        animate(el, { filter: [BLUR_START, BLUR_END], duration: 750, ease: cubicEase });
      },
      onEnterBackward: () => {
        if (played.has(el)) return;
        played.add(el);
        animate(el, { filter: [BLUR_START, BLUR_END], duration: 750, ease: cubicEase });
      },
    });

    scrollObservers.push(observer);
  });
}

export function destroyWorkContent() {
  scrollObservers.forEach((o) => o.revert());
  scrollObservers = [];
  played.clear();
}

export function initWorkContent({ playSharedIntro = false, content = document } = {}) {
  const blocks = collectWorkContentSplits(content);
  setWorkContentHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runWorkContentPageIntro(blocks));
  } else {
    runWorkContentPageIntro(blocks);
  }

  initMediaBlurReveal(content);

  const items = content.querySelectorAll(
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

  content.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
  });
}
