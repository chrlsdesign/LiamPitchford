import {
  createAnimatable,
  createTimeline,
  splitText,
  stagger,
  utils,
} from "animejs";

export function initAbout() {
  const classes = [".about_p", ".about_work", ".about_text", ".about_social"];
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

  const wrapper = document.querySelector(".section.about");
  const blob = document.querySelector(".i-blob");

  const animatable = createAnimatable(blob, {
    x: { duration: 800, ease: "out(3)" },
    y: { duration: 800, ease: "out(3)" },
    rotate: { duration: 600, ease: "linear", unit: "rad" },
  });

  let angle = 0;
  let lastAngle = 0;
  const PI = Math.PI;
  const strength = 0.5;

  let bounds = wrapper.getBoundingClientRect();
  window.addEventListener(
    "resize",
    () => (bounds = wrapper.getBoundingClientRect()),
  );

  wrapper.addEventListener("mousemove", (e) => {
    const { width, height, left, top } = bounds;

    // movement — relative to wrapper
    const x = (e.clientX - left - width / 2) * strength;
    const y = (e.clientY - top - height / 2) * strength;

    animatable.x(x);
    animatable.y(y);

    // rotation from center
    const currentAngle = Math.atan2(
      e.clientY - top - height / 2,
      e.clientX - left - width / 2,
    );
    const diff = currentAngle - lastAngle;
    angle += diff > PI ? diff - 2 * PI : diff < -PI ? diff + 2 * PI : diff;
    lastAngle = currentAngle;

    animatable.rotate(angle * strength);
  });
}
