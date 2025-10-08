import { useEffect } from "react";

export function useClickAway(refs: React.RefObject<HTMLElement>[], onClickAway: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handleClick(event: MouseEvent) {
      if (
        refs.every(ref => ref.current && !ref.current.contains(event.target as Node))
      ) {
        onClickAway();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [refs, onClickAway, enabled]);
}