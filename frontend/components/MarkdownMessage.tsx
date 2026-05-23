"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return extractText(props?.children ?? "");
  }
  return "";
}

function PreWithCopy({ children, ...props }: ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    const text = preRef.current?.textContent ?? extractText(children);
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative my-3 group/code">
      <button
        type="button"
        onClick={copyCode}
        className="absolute top-2 right-2 z-10 rounded px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 opacity-0 group-hover/code:opacity-100 focus:opacity-100 transition-opacity"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        ref={preRef}
        {...props}
        className="hljs overflow-x-auto rounded-lg p-4! m-0! text-[0.8125rem] leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
}

const markdownComponents: Components = {
  pre: PreWithCopy,
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-400 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[0.9em] text-sky-200"
        {...props}
      >
        {children}
      </code>
    );
  },
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
