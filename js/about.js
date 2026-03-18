import { animate, createTimeline, splitText, stagger } from "animejs";

export function initAbout() {
  const { chars_p } = splitText(".about_p", { chars: { wrap: "clip" } });
  const { chars_w } = splitText(".about_work", { chars: { wrap: "clip" } });
  const { chars_t } = splitText(".about_text", { chars: { wrap: "clip" } });
  const { chars_s } = splitText(".about_social", { chars: { wrap: "clip" } });

  const ab_tl = createTimeline();

  animate(
    chars_p,
    {
      y: ["100%", "0%"],
      duration: 750,
      ease: "out(3)",
      delay: stagger(50),
    },
    0,
  );

  ab_tl
    .add(
      chars_w,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    )
    .add(
      chars_t,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    )
    .add(
      chars_s,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    );

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
