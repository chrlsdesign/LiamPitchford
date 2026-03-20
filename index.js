import { Core, Transition, Renderer } from "@unseenco/taxi";
import { initHome, destroyHome } from "./js/home.js";
import { initAbout } from "./js/about.js";
import { initWork } from "./js/work.js";
import { initWorkContent } from "./js/work-content.js";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function updateTime() {
  document.querySelector("#time").textContent = new Date().toLocaleTimeString(
    "en-GB",
    {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

updateTime();
setInterval(updateTime, 1000);

// Fade transition
class FadeTransition extends Transition {
  onLeave({ from, done }) {
    from
      .animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        easing: "ease",
        fill: "forwards",
      })
      .finished.then(done);
  }

  onEnter({ to, done }) {
    to.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 400,
      easing: "ease",
      fill: "forwards",
    }).finished.then(done);
  }
}

class DefaultRenderer extends Renderer {
  initialLoad() {
    this.onEnter();
  }

  onEnter() {
    this.content.querySelectorAll("video[autoplay]").forEach((video) => {
      video.play().catch(() => {}); // catch silences the promise rejection if browser blocks it
    });

    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);

    const path = window.location.pathname;
    if (path === "/") initHome();
    if (path.includes("about")) initAbout();
    if (path.includes("/work")) initWork();
    if (path.includes("work/")) initWorkContent();
  }

  onLeaveCompleted() {
    const path = window.location.pathname;
    if (path === "/") destroyHome();
  }
}

const app = new Core({
  transitions: { default: FadeTransition },
  renderers: { default: DefaultRenderer },
});
