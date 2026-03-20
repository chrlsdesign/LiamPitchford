import { createTimeline, splitText, stagger, utils } from "animejs";

export function initWorkContent() {
  const classes = [".content_title", ".content_desc p"];
  const ab_tl = createTimeline();
  let spduration = 1000,
    spstagger = 10;

  classes.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });

      /*const offset =
        cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;*/

      ab_tl
        .add(split.words, {
          y: ["100%", "0%"],
          duration: spduration,
          ease: "out(3)",
          delay: stagger(spstagger),
        })
        .init();
    });
  });

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
