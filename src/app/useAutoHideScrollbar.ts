import { useEffect, useRef } from 'react';

const HIDE_DELAY_MS = 900;

export function useAutoHideScrollbar<T extends HTMLElement>() {
  // eslint-disable-next-line unicorn/name-replacements
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      element.dataset['scrolling'] = 'true';

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        delete element.dataset['scrolling'];
      }, HIDE_DELAY_MS);
    };

    element.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', onScroll);

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  return ref;
}
