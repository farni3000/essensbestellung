"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { formatIngredientsForWhatsApp } from "@/lib/format";

type Props = {
  ingredients: string[];
  className?: string;
  label?: string;
};

export function CopyIngredientsButton({
  ingredients,
  className = "btn btn-secondary",
  label = "Zutaten kopieren",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const formatted = formatIngredientsForWhatsApp(ingredients);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!fallbackOpen) return;
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFallbackOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fallbackOpen]);

  async function handleCopy() {
    const success = await copyText(formatted);
    if (!success) {
      setFallbackOpen(true);
      return;
    }

    setCopied(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        disabled={ingredients.length === 0}
        className={className}
      >
        {copied ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2.6} />
        )}
        {copied ? "Kopiert!" : label}
      </button>

      {fallbackOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Schließen"
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-fade"
            onClick={() => setFallbackOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-fallback-title"
            className="relative z-10 w-full max-w-lg rounded-[2rem] border-2 border-ink bg-card p-5 shadow-[6px_6px_0_0_#2b2118] animate-pop sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="copy-fallback-title"
                  className="font-display text-2xl font-extrabold"
                >
                  Zum Kopieren
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Dein Browser erlaubt das automatische Kopieren hier nicht.
                  Der Text ist schon markiert – einfach kopieren.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFallbackOpen(false)}
                className="btn btn-ghost btn-icon shrink-0"
                aria-label="Dialog schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              readOnly
              value={formatted}
              rows={Math.min(12, Math.max(4, ingredients.length + 1))}
              className="field mt-4 font-mono text-sm"
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
