import { createPageScope } from "./scope.js";

let cursorScope = null;

export function destroyCursor() {
  cursorScope?.revert();
  cursorScope = null;
}

export function initCursor() {
  cursorScope?.revert();
  cursorScope = createPageScope();

  cursorScope.add((scope) => {
    if (!scope.matches.desktop) return;

    const TAIL_LENGTH = 50;
    const cursor = document.getElementById("cursor");
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let running = true;
    let rafId = 0;

    const cursorHistory = Array(TAIL_LENGTH).fill({ x: 0, y: 0 });

    const onMouseMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    for (let i = 0; i < TAIL_LENGTH; i++) {
      const div = document.createElement("div");
      div.classList.add("cursor-circle");
      cursor.append(div);
    }

    const cursorCircles = Array.from(cursor.querySelectorAll(".cursor-circle"));

    const updateCursor = () => {
      if (!running) return;

      cursorHistory.shift();
      cursorHistory.push({ x: mouseX, y: mouseY });

      for (let i = 0; i < TAIL_LENGTH; i++) {
        const current = cursorHistory[i];
        const next = cursorHistory[i + 1] || cursorHistory[TAIL_LENGTH - 1];

        const xDiff = next.x - current.x;
        const yDiff = next.y - current.y;

        current.x += xDiff * 0.35;
        current.y += yDiff * 0.35;
        cursorCircles[i].style.transform =
          `translate(${current.x}px, ${current.y}px) scale(${i / TAIL_LENGTH})`;
      }

      rafId = requestAnimationFrame(updateCursor);
    };

    document.addEventListener("mousemove", onMouseMove, false);
    updateCursor();

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove, false);
      cursorCircles.forEach((circle) => circle.remove());
    };
  });
}
