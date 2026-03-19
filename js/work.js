import {
  animate,
  createTimeline,
  splitText,
  stagger,
  cubicBezier,
} from "animejs";

export function initWork() {
  // grab all items fresh from the current DOM
  const filters = document.querySelectorAll(
    '[filter-lp="filters"] [filter-lp-field]',
  );
  const items = document.querySelectorAll(
    '[filter-lp="list"] [filter-lp-field]',
  );
  const workItems = document.querySelectorAll(".work_item");

  let activeFilter = "all";

  // use AbortController to clean up all listeners on next call
  const controller = new AbortController();
  const { signal } = controller;

  filters.forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const field = btn.getAttribute("filter-lp-field");
        if (activeFilter === field) {
          activeFilter = "all";
          filters.forEach((f) => f.classList.remove("is-active"));
        } else {
          activeFilter = field;
          filters.forEach((f) => f.classList.remove("is-active"));
          btn.classList.add("is-active");
        }
        items.forEach((item) => {
          const match =
            activeFilter === "all" ||
            item.getAttribute("filter-lp-field") === activeFilter;
          const workItem = item.closest(".work_item");
          if (!workItem) return;
          workItem.classList.toggle("off", !match);
          workItem
            .querySelector(".work_title")
            ?.classList.toggle("off", !match);
        });
      },
      { signal },
    );
  });

  workItems.forEach((item) => {
    item.addEventListener(
      "mouseenter",
      () => {
        if (item.classList.contains("off")) return;
        workItems.forEach((other) => {
          const isActive = other === item;
          other
            .querySelector(".work_title")
            ?.classList.toggle("is-active", isActive);
          const tl = createTimeline();
          const link = other.querySelector(".work_link");
          if (!link) return;

          tl.add(link, {
            display: isActive ? "block" : "none",
            duration: 0,
          }).add(
            other.querySelectorAll(".work_thumb"),
            { opacity: isActive ? 1 : 0, duration: 300, ease: "outQuad" },
            isActive ? 0 : ">=0",
          );
        });
      },
      { signal },
    );
  });

  // return cleanup so the renderer can call it on leave
  return () => controller.abort();
}
