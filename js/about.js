import { animate, splitText, stagger } from "animejs";
import { playSharedIntroIfPresent, updateIntroForPage } from "./intro.js";

const ABOUT_INTRO_CLASSES = [
  ".about_p",
  ".about_work",
  ".about_text",
  ".about_social",
];

function getBrWordIndices(el) {
  const indices = [];
  let wordCount = 0;
  let consecutiveBr = 0;
  const walk = (node) => {
    if (node.nodeType === 1 && node.tagName === "BR") {
      if (consecutiveBr >= 1) indices.push(wordCount - 1);
      consecutiveBr++;
      return;
    }
    if (node.nodeType === 3) {
      const m = node.textContent.match(/\S+/g);
      if (m) {
        wordCount += m.length;
        consecutiveBr = 0;
      }
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(el);
  return indices;
}

function insertBrsAfterWords(el, words, indices) {
  indices.forEach((idx) => {
    const w = words[idx];
    if (!w) return;
    let top = w;
    while (top.parentNode && top.parentNode !== el) {
      top = top.parentNode;
    }
    if (!top.parentNode) return;
    top.parentNode.insertBefore(document.createElement("br"), top.nextSibling);
  });
}

function collectAboutSplits(container) {
  const root = container.querySelector(".about_p") ? container : document;
  const splits = [];

  ABOUT_INTRO_CLASSES.forEach((cls) => {
    root.querySelectorAll(cls).forEach((el) => {
      el.style.visibility = "hidden";
      const brIndices = getBrWordIndices(el);
      const split = splitText(el, {
        lines: { wrap: "clip" },
        words: true,
      });
      splits.push({ split, cls, el, brIndices });
    });
  });

  return splits;
}

function runAboutPageIntro(splits) {
  const spduration = 750;
  const spstagger = 25;
  let aboutPDuration = 0;

  splits.forEach(({ split, cls }) => {
    if (cls === ".about_p") {
      aboutPDuration = spduration + spstagger * split.words.length;
    }
  });

  splits.forEach(({ split, cls, el, brIndices }) => {
    const offset =
      cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;

    split.addEffect(({ words }) => {
      el.style.visibility = "";
      insertBrsAfterWords(el, words, brIndices);
      return animate(words, {
        y: [{ to: ["100%", "0%"] }],
        duration: spduration,
        ease: "out(3)",
        delay: stagger(spstagger, { start: offset }),
      });
    });
  });
}

export function initAbout({
  playSharedIntro = false,
  content = document,
  pageKey = "about",
} = {}) {
  const splits = collectAboutSplits(content);

  if (playSharedIntro) {
    playSharedIntroIfPresent()
      .then(() => updateIntroForPage(pageKey))
      .then(() => runAboutPageIntro(splits));
  } else {
    updateIntroForPage(pageKey).then(() => runAboutPageIntro(splits));
  }
}
