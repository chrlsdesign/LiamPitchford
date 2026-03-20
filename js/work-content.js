export function initWorkContent() {
  console.log("initWorkContent");

  const items = document.querySelectorAll(
    ".content_next--list .content_next--item",
  );
  const total = items.length;

  items.forEach((item, i) => {
    const href = item.querySelector("a").getAttribute("href");

    if (window.location.pathname === href) {
      const nextItem = items[(i + 1) % total];
      nextItem.style.display = "block";
    }
  });

  document.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
  });
}
