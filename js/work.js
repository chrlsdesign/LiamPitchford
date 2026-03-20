import { animate, createTimeline, splitText, stagger, utils } from "animejs";

export function initWork() {
  const classes = [".work_title"];
  const ab_tl = createTimeline();
  let spduration = 1000,
    spstagger = 10;
  let aboutPDuration = 0;

  classes.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });
      const wordCount = split.words.length;
      const totalDuration = spduration + spstagger * wordCount; // duration + stagger * words

      if (cls === ".about_p") {
        aboutPDuration = totalDuration;
      }

      const offset =
        cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;

      ab_tl
        .add(
          split.words,
          {
            y: ["100%", "0%"],
            duration: spduration,
            ease: "out(3)",
            delay: stagger(spstagger),
          },
          offset,
        )
        .init();
    });
  });

  const filters = document.querySelectorAll(
    '[filter-lp="filters"] [filter-lp-field]',
  );
  const items = document.querySelectorAll(
    '[filter-lp="list"] [filter-lp-field]',
  );

  let activeFilter = "all";
  const controller = new AbortController();
  const { signal } = controller;
  const workItems = document.querySelectorAll(".work_item");
  let activeItem = null;

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.getAttribute("filter-lp-field");

      // If clicking active filter, deactivate it (clear all)
      if (activeFilter === field) {
        activeFilter = "all";
        filters.forEach((f) => f.classList.remove("is-active"));
      } else {
        activeFilter = field;
        filters.forEach((f) => f.classList.remove("is-active"));
        btn.classList.add("is-active");
      }

      // Show/hide items
      items.forEach((item) => {
        const match =
          activeFilter === "all" ||
          item.getAttribute("filter-lp-field") === activeFilter;
        const workItem = item.closest(".work_item");
        workItem.classList.toggle("off", !match);
        workItem.querySelector(".work_title").classList.toggle("off", !match);
      });
    });
  });

  //Hover Project
  workItems.forEach((item) => {
    item.querySelector(".work_title")?.classList.remove("is-active");
    const link = item.querySelector(".work_link");
    const thumbs = item.querySelectorAll(".work_thumb");
    if (link) link.style.display = "none";
    thumbs.forEach((thumb) => (thumb.style.opacity = "0"));
  });

  workItems.forEach((item) => {
    item.addEventListener(
      "mouseover",
      () => {
        if (item.classList.contains("off")) return;
        if (item === activeItem) return;

        // deactivate previous
        if (activeItem) {
          activeItem
            .querySelector(".work_title")
            ?.classList.remove("is-active");
          animate(activeItem.querySelectorAll(".work_thumb"), {
            opacity: 0,
            duration: 300,
            ease: "outQuad",
          });
          animate(activeItem.querySelector(".work_link"), {
            display: "none",
            pointerEvents: "none",
            duration: 0,
          });
        }

        // activate current
        item.querySelector(".work_title")?.classList.add("is-active");
        animate(item.querySelector(".work_link"), {
          display: "block",
          pointerEvents: "auto",
          duration: 0,
        });
        animate(item.querySelectorAll(".work_thumb"), {
          opacity: 1,
          duration: 300,
          ease: "outQuad",
        });

        activeItem = item;
      },
      { signal },
    );
  });
}
