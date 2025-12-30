import { type RefObject, useLayoutEffect, useRef, useState } from "react";

/**
 * Hook to detect if an element's text content is truncated via CSS overflow.
 * Works with elements that have `text-overflow: ellipsis` and `overflow: hidden`.
 *
 * @param content - The content to monitor for changes (triggers re-evaluation)
 * @returns A tuple containing:
 *   - ref: A RefObject to attach to the element you want to monitor
 *   - isTruncated: Boolean indicating if the element's content is truncated
 *
 * @example
 * ```tsx
 * const [ref, isTruncated] = useIsTruncated<HTMLSpanElement>(text);
 * return (
 *   <span ref={ref} className="truncate">
 *     {text}
 *   </span>
 * );
 * ```
 */
export function useIsTruncated<T extends HTMLElement = HTMLElement>(
  content: string,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: content triggers re-evaluation when it changes
  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [content]);

  return [ref, isTruncated];
}
