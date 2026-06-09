import { createScope } from "animejs";

/** Webflow tablet breakpoint — home.js uses max-width 991px for mobile tuning. */
export const MEDIA_QUERIES = {
  desktop: "(min-width: 992px)",
};

export function createPageScope(root = document) {
  return createScope({
    root,
    mediaQueries: MEDIA_QUERIES,
  });
}

export function isDesktop(scope) {
  return Boolean(scope?.matches?.desktop);
}
