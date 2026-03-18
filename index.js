import { Core, Transition, Renderer } from "@unseenco/taxi";
import { initHome } from "./js/home.js";
import { initAbout } from "./js/about.js";
import { initWork } from "./js/work.js";
import { initWorkContent } from "./js/work-content.js";

console.log("Getting in App JS");

document.body.scrollTop = 0; // For Safari
document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE, and Opera
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
    const path = window.location.pathname;

    if (path === "/") initHome();
    if (path.includes("about")) initAbout();
    if (path.includes("work")) initWork();
  }
}

const app = new Core({
  transitions: { default: FadeTransition },
  renderers: { default: DefaultRenderer },
});
