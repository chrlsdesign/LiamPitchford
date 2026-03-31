import {
  animate,
  createAnimatable,
  createTimeline,
  splitText,
  stagger,
  utils,
} from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const ABOUT_LINE_CLASSES = [".about_p"];
const ABOUT_WORD_CLASSES = [".about_work", ".about_text", ".about_social"];

function collectAboutSplits(container) {
  const spduration = 1000;
  const wordStagger = 10;
  const lineStagger = 80;
  let aboutPDuration = 0;
  const blocks = [];

  ABOUT_LINE_CLASSES.forEach((cls) => {
    container.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { lines: { wrap: "clip" } });
      const lineCount = split.lines.length;
      const totalDuration = spduration + lineStagger * lineCount;

      if (cls === ".about_p") {
        aboutPDuration = totalDuration;
      }

      blocks.push({ targets: split.lines, offset: 0, spduration, spstagger: lineStagger });
    });
  });

  ABOUT_WORD_CLASSES.forEach((cls) => {
    container.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });

      const offset =
        cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;

      blocks.push({ targets: split.words, offset, spduration, spstagger: wordStagger });
    });
  });

  return blocks;
}

function setAboutHidden(blocks) {
  blocks.forEach(({ targets }) => {
    animate(targets, { y: "100%", duration: 0 });
  });
}

function runAboutPageIntro(blocks) {
  const ab_tl = createTimeline();

  blocks.forEach(({ targets, offset, spduration, spstagger }) => {
    ab_tl.add(
      targets,
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

export function initAbout({ playSharedIntro = false, content = document } = {}) {
  const blocks = collectAboutSplits(content);
  setAboutHidden(blocks);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runAboutPageIntro(blocks));
  } else {
    runAboutPageIntro(blocks);
  }

  const wrapper = content.querySelector(".section.about");
  const blob = content.querySelector(".i-blob");
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
