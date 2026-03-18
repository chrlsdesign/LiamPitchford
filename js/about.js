import { animate, createTimeline, splitText, stagger } from "animejs";

export function initAbout() {
  const { cp } = splitText(".about_p", { chars: { wrap: "clip" } });
  const { cw } = splitText(".about_work", { chars: { wrap: "clip" } });
  const { ct } = splitText(".about_text", { chars: { wrap: "clip" } });
  const { cs } = splitText(".about_social", { chars: { wrap: "clip" } });

  const ab_tl = createTimeline();

  ab_tl
    .add(
      cp,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    )
    .add(
      cw,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    )
    .add(
      ct,
      {
        y: ["100%", "0%"],
        duration: 750,
        ease: "out(3)",
        delay: stagger(50),
      },
      0,
    )
    .add(
      cs,
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
