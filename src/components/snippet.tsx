import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

import { copyToClipboard } from "@/utils/clipboard";
import { cn } from "@/utils/cn";

interface SnippetProps {
  text?: string;
  title: string;
  placeholder?: string;
  onCopy?: () => void;
}

export const Snippet = ({ text, title, placeholder, onCopy }: SnippetProps) => {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<NodeJS.Timeout>(null);

  const onClick = () => {
    if (!text) return;
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    setCopied(true);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000);

    copyToClipboard(text);

    if (onCopy) onCopy();
  };

  return (
    <div className="snippet" data-copied={copied}>
      <pre className={cn("snippet-text", !text && "snippet-text--empty")}>
        {text || placeholder}
      </pre>
      <button
        type="button"
        disabled={!text}
        title={title}
        onClick={onClick}
        className="snippet-button"
      >
        <Copy className="snippet-icon snippet-icon--copy" />
        <Check className="snippet-icon snippet-icon--check" />
      </button>
    </div>
  );
};
