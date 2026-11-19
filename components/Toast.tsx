"use client";

import { useEffect, useRef } from "react";
import { CircleCheck } from "lucide-react";

export function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = window.setTimeout(() => onDoneRef.current(), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-3 text-sm font-bold shadow-[4px_4px_0_0_#2b2118] animate-pop"
    >
      <CircleCheck className="h-5 w-5 shrink-0 text-olive" strokeWidth={2.5} />
      <span>{message}</span>
    </div>
  );
}
