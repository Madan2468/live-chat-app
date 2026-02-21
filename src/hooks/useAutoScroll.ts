import { useRef, useEffect, useState } from "react";

export function useAutoScroll(dependencies: any[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setShowNewMessageButton(false);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const isAtBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop <=
      scrollContainer.clientHeight + 100;

    if (isAtBottom) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    } else {
      setShowNewMessageButton(true);
    }
  }, dependencies);

  return { scrollRef, scrollToBottom, showNewMessageButton };
}
