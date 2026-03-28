import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a ref-callback. Attach it to any container element and every
 * child with class "reveal" will get class "visible" added once it
 * enters the viewport, triggering the CSS animation.
 */
export function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              observerRef.current?.unobserve(e.target);
            }
          }),
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
      );
    }
    node.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("visible");
      } else {
        observerRef.current!.observe(el);
      }
    });
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return attach;
}
