import { animate, createAnimatable, splitText, stagger } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

const ABOUT_INTRO_CLASSES = [
  ".about_p",
  ".about_work",
  ".about_text",
  ".about_social",
];

function collectAboutSplits(container) {
  const root = container.querySelector(".about_p") ? container : document;
  const splits = [];

  ABOUT_INTRO_CLASSES.forEach((cls) => {
    root.querySelectorAll(cls).forEach((el) => {
      const split = splitText(el, {
        lines: { wrap: "clip" },
        words: true,
      });
      split.words.forEach((w) => {
        w.style.transform = "translateY(100%)";
      });
      splits.push({ split, cls });
    });
  });

  return splits;
}

function runAboutPageIntro(splits) {
  const spduration = 750;
  const spstagger = 50;
  let aboutPDuration = 0;

  splits.forEach(({ split, cls }) => {
    if (cls === ".about_p") {
      aboutPDuration = spduration + spstagger * split.words.length;
    }
  });

  splits.forEach(({ split, cls }) => {
    const offset =
      cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;

    split.addEffect(({ words }) =>
      animate(words, {
        y: ["100%", "0%"],
        duration: spduration,
        ease: "out(3)",
        delay: stagger(spstagger, { start: offset }),
      }),
    );
  });
}

export function initAbout({
  playSharedIntro = false,
  content = document,
} = {}) {
  const splits = collectAboutSplits(content);

  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runAboutPageIntro(splits));
  } else {
    runAboutPageIntro(splits);
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
