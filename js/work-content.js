import { createTimeline, splitText, stagger, utils } from "animejs";
import { playSharedIntroIfPresent } from "./intro.js";

function runWorkContentPageIntro() {
  const classes = [".content_title", ".content_desc p"];
  const ab_tl = createTimeline();
  let spduration = 1000,
    spstagger = 10;

  classes.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });

      ab_tl
        .add(
          split.words,
          {
            y: ["100%", "0%"],
            duration: spduration,
            ease: "out(3)",
            delay: stagger(spstagger),
          },
          0,
        )
        .init();
    });
  });
}

export function initWorkContent({ playSharedIntro = false } = {}) {
  if (playSharedIntro) {
    playSharedIntroIfPresent().then(() => runWorkContentPageIntro());
  } else {
    runWorkContentPageIntro();
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
