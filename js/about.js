import { animate, createTimeline, splitText, stagger } from "animejs";

export function initAbout() {
  const classes = [".about_p", ".about_work", ".about_text", ".about_social"];
  const ab_tl = createTimeline();

  classes.forEach((cls) => {
    const split = splitText(cls, { words: { wrap: "clip" } });
    ab_tl.add(
      split.words,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(10),
      },
      0,
    );
  });

  const section = document.querySelector(".section.about");
  const grads = document.querySelectorAll(".about_bg-grad");
  const total = grads.length;
  const maxOffset = 10;

  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    const xShift = (mouseX - 0.5) * maxOffset * 3.5; // base shift from mouse X

    grads.forEach((grad, i) => {
      // Normalize grad position 0 to 1
      const gradPos = i / (total - 1);

      // Distance from mouse Y — grads near mouse get positive, far get negative
      const dist = gradPos - mouseY; // -1 to 1

      // Wave: closer to mouse = more shift, further = less, opposite side = negative
      const wave = xShift * (1 - Math.abs(dist) * 2);

      grad.style.transform = `translateX(${wave}%)`;
    });
  });
}
