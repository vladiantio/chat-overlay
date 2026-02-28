import { useEffect, type RefObject } from 'react';

export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  trigger: unknown
) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [ref, trigger]);
}
