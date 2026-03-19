import {
  animate,
  createTimeline,
  splitText,
  stagger,
  cubicBezier,
} from "animejs";

export function initWork() {
  const filters = document.querySelectorAll(
    '[filter-lp="filters"] [filter-lp-field]',
  );
  const items = document.querySelectorAll(
    '[filter-lp="list"] [filter-lp-field]',
  );

  let activeFilter = "all";
  const controller = new AbortController();
  const { signal } = controller;

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

  const workItems = document.querySelectorAll(".work_item");

  workItems.forEach((item) => {
    item.querySelector(".work_title")?.classList.remove("is-active");
    const link = item.querySelector(".work_link");
    if (link) link.style.display = "none";
    item
      .querySelectorAll(".work_thumb")
      .forEach((thumb) => (thumb.style.opacity = ""));
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
            .classList.toggle("is-active", isActive);
          const tl = createTimeline();
          tl.add(other.querySelector(".work_link"), {
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
}
