import type { ChatUserstate } from "tmi.js";

import Markdown, { ReactRenderer } from "marked-react";
import { isValidElement } from "react";

import { cn } from "@/utils/cn";

import { parseEmoteImageSrcSet, parseMarkdown } from "./parsers";

const renderer: Partial<ReactRenderer> = {
  paragraph(children) {
    const hasOnlyImages =
      typeof children !== "string" &&
      Array.from(children as Iterable<React.ReactNode>).every(
        (child) =>
          (typeof child == "string" && child.trim().length === 0) ||
          (isValidElement(child) && child.type === "img"),
      );
    return (
      <p className={cn(hasOnlyImages && "[&>img]:my-[0.25lh] [&>img]:h-[2lh]")}>
        {children}
      </p>
    );
  },
  blockquote(children) {
    return <div className="border-l-3 pl-3 opacity-80">{children}</div>;
  },
  codespan(code) {
    return (
      <code className="inline-block rounded-md bg-(--tint-color)/10 px-2 font-bold text-(--tint-color)">
        {code}
      </code>
    );
  },
  em(children) {
    return <em style={{ fontFamily: "Poppins" }}>{children}</em>;
  },
  heading(children, level) {
    let className = "";
    switch (level) {
      case 1:
        className = "text-7xl";
        break;
      case 2:
        className = "text-6xl";
        break;
      case 3:
        className = "text-5xl";
        break;
      case 4:
        className = "text-4xl";
        break;
      case 5:
        className = "text-3xl";
        break;
      case 6:
        className = "text-2xl";
        break;
    }
    return <span className={cn("font-bold", className)}>{children}</span>;
  },
  hr() {
    return <hr className="my-4 h-0.5 w-40 bg-white opacity-60" />;
  },
  image(src, alt, title) {
    return (
      <img
        src={src}
        srcSet={parseEmoteImageSrcSet(src)}
        alt={alt}
        title={title ?? undefined}
        className="-mt-[0.25lh] inline-block h-lh px-[2px] align-middle"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  },
  link(_href, text) {
    return <span className="text-(--tint-color) underline">{text}</span>;
  },
};

interface MessageRendererProps {
  message: string;
  emotes?: ChatUserstate["emotes"];
}

export function MessageRenderer({ message, emotes }: MessageRendererProps) {
  return (
    <Markdown renderer={renderer} value={parseMarkdown(message, emotes)} />
  );
}
