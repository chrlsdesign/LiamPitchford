import { animate, createTimeline, cubicBezier, onScroll, splitText, stagger } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const WORK_CONTENT_INTRO_CLASSES = [".content_title", ".content_desc p"];

function collectWorkContentWordSplits(container) {
  const spduration = 1000;
  const spstagger = 10;
  const blocks = [];
  const root = container.querySelector(".content_title") ? container : document;

  WORK_CONTENT_INTRO_CLASSES.forEach((cls) => {
    root.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      blocks.push({ split, spduration, spstagger });
    });
  });

  return blocks;
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

const BLUR_START = "blur(20px)";
const BLUR_END = "blur(0px)";

let scrollObservers = [];
const played = new Set();

function initMediaBlurReveal(container) {
  const cubicEase = cubicBezier(0.67, 0, 0.27, 1);
  const root = container.querySelector("img, video") ? container : document;
  const mediaEls = root.querySelectorAll("img:not(.content_next--list img), video:not(.content_next--list video)");

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
  const blocks = collectWorkContentWordSplits(content);
  setWorkContentWordsHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runWorkContentPageIntro(blocks));
  } else {
    runWorkContentPageIntro(blocks);
  }

  initMediaBlurReveal(content);

  const wcRoot = content.querySelector(".content_next--list") ? content : document;
  const items = wcRoot.querySelectorAll(
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

  wcRoot.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
  });
}
