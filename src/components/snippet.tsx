import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

import { copyToClipboard } from "@/utils/clipboard";
import { cn } from "@/utils/cn";

interface SnippetProps {
  text?: string;
  placeholder?: string;
  onCopy?: () => void;
}

export const Snippet = ({ text, placeholder, onCopy }: SnippetProps) => {
  const [animation, setAnimation] = useState<boolean>(false);
  const animationTimeout = useRef<NodeJS.Timeout>(null);

  const onClick = () => {
    if (!text) return;
    if (animationTimeout.current) clearTimeout(animationTimeout.current);
    setAnimation(true);
    animationTimeout.current = setTimeout(() => setAnimation(false), 2000);

    copyToClipboard(text);

    if (onCopy) onCopy();
  };

  return (
    <div className="flex w-full rounded-xl border bg-neutral-800 p-1">
      <pre
        className={cn("mr-3 flex-1 px-3 py-1.5 text-sm", !text && "opacity-50")}
      >
        {text || placeholder}
      </pre>
      <button
        type="button"
        disabled={!text}
        onClick={onClick}
        className="relative flex cursor-pointer items-center justify-center rounded-lg px-2 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50"
      >
        <Copy
          className={cn(
            "size-[1.2rem] scale-100 rotate-0 transition-all",
            animation && "scale-0 -rotate-90",
          )}
        />
        <Check
          className={cn(
            "absolute size-[1.2rem] scale-0 rotate-90 text-green-500 transition-all",
            animation && "scale-100 rotate-0",
          )}
        />
      </button>
    </div>
  );
};
