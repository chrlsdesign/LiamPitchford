import { animate, createTimeline, splitText, stagger, utils } from "animejs";

export function initWork() {
  const classes = [".work_title"];
  const ab_tl = createTimeline();
  let spduration = 1000,
    spstagger = 10;

  classes.forEach((cls) => {
    utils.$(cls).forEach((el) => {
      const split = splitText(el, { words: { wrap: "clip" } });

      /*const offset =
        cls === ".about_text" || cls === ".about_social" ? aboutPDuration : 0;*/

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

  const controller = new AbortController();
  const { signal } = controller;
  const workItems = document.querySelectorAll(".work_item");
  let activeItem = null;

  /* const filters = document.querySelectorAll(
    '[filter-lp="filters"] [filter-lp-field]',
  );
  const items = document.querySelectorAll(
    '[filter-lp="list"] [filter-lp-field]',
  );

  let activeFilter = "all";

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
  });*/

  //Hover Project
  workItems.forEach((item) => {
    item.querySelector(".work_title")?.classList.remove("is-active");
    const link = item.querySelector(".work_thumb--holder");
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
            filter: ["blur(0px)", "blur(20px)"],
            duration: 300,
            ease: "outQuad",
          });
          animate(
            activeItem.querySelector(".work_thumb--holder"),
            {
              display: "none",
              duration: 0,
            },
            "<",
          );
        }

        // activate current
        item.querySelector(".work_title")?.classList.add("is-active");
        animate(item.querySelector(".work_thumb--holder"), {
          display: "flex",
          duration: 0,
        });
        animate(
          item.querySelectorAll(".work_thumb"),
          {
            opacity: 1,
            filter: ["blur(20px)", "blur(0px)"],
            duration: 300,
            ease: "outQuad",
          },
          "<",
        );

        activeItem = item;
      },
      { signal },
    );
  });

  const duration = 40; // match your animation duration in seconds

  function mouseToProgress(mx, my) {
    // mx, my normalized 0-1 (mouse % of screen)
    // Square path: TL(0,0) → TR(1,0) → BR(1,1) → BL(0,1) → TL
    // Find closest edge and its arc position

    const edges = [
      { t: mx, dist: my }, // top edge,    y=0
      { t: my + 1, dist: 1 - mx }, // right edge,  x=1
      { t: 1 - mx + 2, dist: 1 - my }, // bottom edge, y=1
      { t: 1 - my + 3, dist: mx }, // left edge,   x=0
    ];

    const best = edges.reduce((a, b) => (b.dist < a.dist ? b : a));
    return best.t / 4; // 0-1
  }

  function seekTo(el, progress) {
    el.style.animationDelay = `-${progress * duration}s`;
    el.style.animationPlayState = "paused";
  }

  const g1 = document.querySelector(".work-g1");
  const g2 = document.querySelector(".work-g2");
  let resumeTimer = null;

  document.addEventListener("mousemove", (e) => {
    const mx = e.clientX / window.innerWidth;
    const my = e.clientY / window.innerHeight;

    const g1Progress = mouseToProgress(mx, my);
    const g2Progress = (g1Progress + 0.5) % 1; // g2 is half a cycle offset

    seekTo(g1, g1Progress);
    seekTo(g2, g2Progress);

    clearTimeout(resumeTimer);

    resumeTimer = setTimeout(() => {
      // resume from current frozen position
      g1.style.animationPlayState = "running";
      g2.style.animationPlayState = "running";
    }, 1500);
  });
}
