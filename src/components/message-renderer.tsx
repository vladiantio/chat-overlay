import Markdown, { ReactRenderer } from 'marked-react';
import type { ChatUserstate } from 'tmi.js';
import { parseEmoteImageSrcSet, parseEmotes } from '../utils/emotes';
import { cn } from '../utils/cn';
import { isValidElement } from 'react';

const renderer: Partial<ReactRenderer> = {
  paragraph(children) {
    const hasOnlyImages = typeof children !== "string" && Array.from(children as Iterable<React.ReactNode>).every(child => (typeof child == "string" && child.trim().length === 0) || (isValidElement(child) && child.type === "img"))
    return (
      <p className={cn(hasOnlyImages && "[&>img]:h-[2lh] [&>img]:my-[0.25lh]")}>{children}</p>
    )
  },
  blockquote(children) {
    return (
      <div className="border-l-3 pl-3 opacity-80">{children}</div>
    );
  },
  em(children) {
    return (
      <em style={{ fontFamily: "Poppins" }}>{children}</em>
    )
  },
  heading(children, level) {
    let className="";
    switch (level) {
      case 1: className="text-7xl"; break;
      case 2: className="text-6xl"; break;
      case 3: className="text-5xl"; break;
      case 4: className="text-4xl"; break;
      case 5: className="text-3xl"; break;
      case 6: className="text-2xl"; break;
    }
    return (
      <span className={cn("font-bold", className)}>{children}</span>
    );
  },
  hr() {
    return (
      <hr className="w-40 h-0.5 my-4 bg-white opacity-60" />
    )
  },
  image(src, alt, title) {
    return (
      <img
        src={src}
        srcSet={parseEmoteImageSrcSet(src)}
        alt={alt}
        title={title ?? undefined}
        className="inline-block align-middle -mt-[0.25lh] px-[2px] h-lh drop-shadow-md drop-shadow-black/50"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    )
  },
  link(_href, text) {
    return (
      <span className="text-purple-300 underline">{text}</span>
    );
  },
};

interface MessageRendererProps {
  message: string
  emotes?: ChatUserstate['emotes']
}

export function MessageRenderer({
  message,
  emotes,
}: MessageRendererProps) {
  return (
    <Markdown
      value={parseEmotes(message, emotes)}
      renderer={renderer}
    />
  );
}
