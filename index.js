import { Core, Transition, Renderer } from "@unseenco/taxi";
import { initHome, destroyHome } from "./js/home.js";
import { initAbout } from "./js/about.js";
import { initWork } from "./js/work.js";
import { initWorkContent, destroyWorkContent } from "./js/work-content.js";
import { updateIntroForPage } from "./js/intro.js";

/** 1 = first paint after full page load / refresh; 2+ = Taxi swaps (same JS session). */
let taxiContentEnterCount = 0;

function routeSegments(pathname) {
  const p = pathname.split("?")[0].toLowerCase().replace(/\/+$/, "") || "/";
  const segs = p === "/" ? [] : p.split("/").filter(Boolean);
  return { p, segs };
}

function isHomeSegments(segs) {
  return (
    segs.length === 0 ||
    (segs.length === 1 &&
      (segs[0] === "index.html" || segs[0] === "index.htm"))
  );
}

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
      video.play().catch(() => {});
    });

    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);

    taxiContentEnterCount += 1;
    const playSharedIntro = taxiContentEnterCount === 1;

    const { segs } = routeSegments(window.location.pathname);
    const isHome = isHomeSegments(segs);
    const isAbout = segs.includes("about");
    const wi = segs.indexOf("work");
    const isWorkContent = wi !== -1 && wi < segs.length - 1;
    const isWorkList = wi !== -1 && wi === segs.length - 1;

    const content = this.content;

    let pageKey = "home";
    if (isAbout) pageKey = "about";
    else if (isWorkContent) pageKey = "workContent";
    else if (isWorkList) pageKey = "work";

    if (!playSharedIntro) {
      updateIntroForPage(pageKey);
    }

    if (isHome) {
      initHome({ playSharedIntro, content, pageKey });
    }
    if (isAbout) {
      initAbout({ playSharedIntro, content, pageKey });
    }
    if (isWorkContent) {
      initWorkContent({ playSharedIntro, content, pageKey });
    } else if (isWorkList) {
      initWork({ playSharedIntro, content, pageKey });
    }
  }

  onLeaveCompleted() {
    destroyWorkContent();
    const { segs } = routeSegments(window.location.pathname);
    if (isHomeSegments(segs)) destroyHome();
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
