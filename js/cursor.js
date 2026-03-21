export function initCursor() {
  const COLORS = [
    [18 / 255, 113 / 255, 255 / 255],
    [221 / 255, 74 / 255, 255 / 255],
    [100 / 255, 220 / 255, 255 / 255],
    [200 / 255, 200 / 255, 50 / 255],
    [180 / 255, 180 / 255, 50 / 255],
  ];

  console.clear();

  const TAIL_LENGTH = 50;

  const cursor = document.getElementById("cursor");

  let mouseX = 0;
  let mouseY = 0;

  let cursorCircles;
  let cursorHistory = Array(TAIL_LENGTH).fill({ x: 0, y: 0 });

  function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  function initCursor() {
    for (let i = 0; i < TAIL_LENGTH; i++) {
      let div = document.createElement("div");
      div.classList.add("cursor-circle");
      cursor.append(div);
    }
    cursorCircles = Array.from(document.querySelectorAll(".cursor-circle"));
  }

  function updateCursor() {
    cursorHistory.shift();
    cursorHistory.push({ x: mouseX, y: mouseY });

    for (let i = 0; i < TAIL_LENGTH; i++) {
      let current = cursorHistory[i];
      let next = cursorHistory[i + 1] || cursorHistory[TAIL_LENGTH - 1];

      let xDiff = next.x - current.x;
      let yDiff = next.y - current.y;

      current.x += xDiff * 0.35;
      current.y += yDiff * 0.35;
      cursorCircles[i].style.transform =
        `translate(${current.x}px, ${current.y}px) scale(${i / TAIL_LENGTH})`;
    }
    requestAnimationFrame(updateCursor);
  }

  document.addEventListener("mousemove", onMouseMove, false);

  initCursor();
  updateCursor();
}
