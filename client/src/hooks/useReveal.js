import { useEffect, useRef, useState } from 'react';

// Returns [ref, visible]: visible turns true the first time the element
// scrolls into view. CSS does the actual animation (see .reveal in global.css).
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setVisible(true); // old browser or test environment: just show it
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // only animate once
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect(); // cleanup
  }, []);

  return [ref, visible];
}
