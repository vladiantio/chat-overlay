import type { ChatUserstate } from "tmi.js";

import Markdown, { ReactRenderer } from "marked-react";
import { isValidElement } from "react";

import type { ChatReplyTo } from "@/types/chat";

import { cn } from "@/utils/cn";

import { parseMarkdown } from "./parsers";

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
      <p className={cn(hasOnlyImages && "md-paragraph--image-only")}>
        {children}
      </p>
    );
  },
  blockquote(children) {
    return <div className="md-blockquote">{children}</div>;
  },
  codespan(code) {
    return <code className="md-code">{code}</code>;
  },
  heading(children, level) {
    return (
      <span className={`md-heading-${level}`}>{children}</span>
    );
  },
  hr() {
    return <hr className="md-hr" />;
  },
  image(src, alt, title) {
    return (
      <img
        src={src}
        alt={alt}
        title={title ?? undefined}
        className="md-image"
        onError={(e) => {
          e.currentTarget.style.opacity = "0";
        }}
      />
    );
  },
  link(_href, text) {
    return <span className="md-link">{text}</span>;
  },
};

interface MessageRendererProps {
  message: string;
  emotes?: ChatUserstate["emotes"];
  replyTo?: ChatReplyTo;
}

export function MessageRenderer({
  message,
  emotes,
  replyTo,
}: MessageRendererProps) {
  return (
    <Markdown
      renderer={renderer}
      value={parseMarkdown(message, emotes, replyTo)}
    />
  );
}
