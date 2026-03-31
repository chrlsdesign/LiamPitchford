import {
  animate,
  createAnimatable,
  createTimeline,
  splitText,
  stagger,
  utils,
} from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const ABOUT_INTRO_CLASSES = [
  ".about_p",
  ".about_work",
  ".about_text",
  ".about_social",
];

function collectAboutWordSplits(container) {
  const spduration = 1000;
  const spstagger = 10;
  let aboutPDuration = 0;
  const blocks = [];
  const root = container.querySelector(".about_p") ? container : document;

  ABOUT_INTRO_CLASSES.forEach((cls) => {
    root.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      const wordCount = split.words.length;
      const totalDuration = spduration + spstagger * wordCount;

      if (cls === ".about_p") {
        aboutPDuration = totalDuration;
      }

      const offset =
        cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;

      blocks.push({ split, offset, spduration, spstagger });
    });
  });

  return blocks;
}

function setAboutWordsHidden(blocks) {
  blocks.forEach(({ split }) => {
    animate(split.words, { y: "100%", duration: 0 });
  });
}

function runAboutPageIntro(blocks) {
  const ab_tl = createTimeline();

  blocks.forEach(({ split, offset, spduration, spstagger }) => {
    ab_tl.add(
      split.words,
      {
        y: ["100%", "0%"],
        duration: spduration,
        ease: "out(3)",
        delay: stagger(spstagger, { start: offset }),
      },
      0,
    );
  });

  ab_tl.init();
}

export function initAbout({
  playSharedIntro = false,
  content = document,
} = {}) {
  const blocks = collectAboutWordSplits(content);
  setAboutWordsHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runAboutPageIntro(blocks));
  } else {
    runAboutPageIntro(blocks);
  }

  const wrapper =
    content.querySelector(".section.about") ||
    document.querySelector(".section.about");
  const blob =
    content.querySelector(".i-blob") || document.querySelector(".i-blob");
  if (!wrapper || !blob) return;

  const animatable = createAnimatable(blob, {
    x: { duration: 800, ease: "out(3)" },
    y: { duration: 800, ease: "out(3)" },
  });

  let angle = 0;
  let lastAngle = 0;
  const PI = Math.PI;
  const strength = 1;

  let bounds = wrapper.getBoundingClientRect();
  window.addEventListener(
    "resize",
    () => (bounds = wrapper.getBoundingClientRect()),
  );

  wrapper.addEventListener("mousemove", (e) => {
    const { width, height, left, top } = bounds;

    // movement — relative to wrapper
    const x = (e.clientX - left - width / 2) * strength;
    const y = (e.clientY - top - height / 2) * strength;

    animatable.x(x);
    animatable.y(y);
  });
}
