import { Core, Transition, Renderer } from "@unseenco/taxi";
import { initHome, destroyHome } from "./js/home.js";
import { initAbout } from "./js/about.js";
import { initWork } from "./js/work.js";
import { initWorkContent } from "./js/work-content.js";
const introPlayedByPage = {
  home: false,
  about: false,
  work: false,
  workContent: false,
};

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
    if (path === "/") {
      initHome({ playIntro: !introPlayedByPage.home });
      introPlayedByPage.home = true;
    }
    if (path.includes("about")) {
      initAbout({ playIntro: !introPlayedByPage.about });
      introPlayedByPage.about = true;
    }
    if (path.includes("work/")) {
      initWorkContent({ playIntro: !introPlayedByPage.workContent });
      introPlayedByPage.workContent = true;
    } else if (path.includes("/work")) {
      initWork({ playIntro: !introPlayedByPage.work });
      introPlayedByPage.work = true;
    }
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

app.on("NAVIGATE_END", ({ to }) => {
  const currentPath = to.pathname;

  document.querySelectorAll(".nav a, .nav_link").forEach((link) => {
    link.classList.remove("w--current");
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("w--current");
    }
  });
});
