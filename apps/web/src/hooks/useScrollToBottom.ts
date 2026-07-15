import { useEffect, useRef } from 'react';

const SCROLL_BOTTOM_THRESHOLD_PX = 80;

const useScrollToBottom = (messageCount: number) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messageCount);
  const isNearBottomRef = useRef(true);

  // Track whether user is near bottom via scroll events
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll when a new message is added
  useEffect(() => {
    if (messageCount === prevCountRef.current) return;
    const wasEmpty = prevCountRef.current === 0;
    prevCountRef.current = messageCount;
    const el = scrollContainerRef.current;
    if (!el) return;
    if (wasEmpty || isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: wasEmpty ? 'instant' : 'smooth' });
      isNearBottomRef.current = true;
    }
  }, [messageCount]);

  // Scroll during streaming when message content grows
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let rafId: number;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (isNearBottomRef.current) {
          el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
        }
      });
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return { scrollContainerRef };
};

export { useScrollToBottom };
