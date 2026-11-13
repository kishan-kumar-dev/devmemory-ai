"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

type MarkdownContentProps = {
  content: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x20;|&#32;|&nbsp;/gi, " ")
    .replace(/&#x2A;/gi, "*")
    .replace(/&#x60;/gi, "`")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function normalizeMarkdown(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let insideCodeBlock = false;

  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(?:\\\x60){3,}|^(\s*)\x60{3,}/);

    if (fenceMatch) {
      output.push(line.replace(/\\\x60/g, "\x60"));
      insideCodeBlock = !insideCodeBlock;
      continue;
    }

    if (insideCodeBlock) {
      output.push(line);
      continue;
    }

    output.push(
      decodeEntities(line).replace(/\\([\\`*_{}\[\]()#+.!|>~-])/g, "$1"),
    );
  }

  return output.join("\n").trim();
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const normalizedContent = normalizeMarkdown(content);

  return (
    <article
      className="
        markdown-content
        min-w-0 w-full max-w-none break-words
        text-sm leading-7 text-slate-300

        [&_h1]:mb-4 [&_h1]:mt-7
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white

        [&_h2]:mb-3 [&_h2]:mt-7
        [&_h2]:border-b [&_h2]:border-white/10
        [&_h2]:pb-2 [&_h2]:text-xl
        [&_h2]:font-bold [&_h2]:text-white

        [&_h3]:mb-3 [&_h3]:mt-6
        [&_h3]:text-lg [&_h3]:font-semibold
        [&_h3]:text-violet-200

        [&_p]:mb-4 [&_p]:leading-7
        [&_strong]:font-semibold [&_strong]:text-white
        [&_em]:text-violet-200

        [&_ul]:my-4 [&_ul]:ml-6
        [&_ul]:list-disc [&_ul]:space-y-2

        [&_ol]:my-4 [&_ol]:ml-6
        [&_ol]:list-decimal [&_ol]:space-y-2

        [&_li]:pl-1 [&_li]:leading-7

        [&_blockquote]:my-5
        [&_blockquote]:rounded-r-lg
        [&_blockquote]:border-l-4
        [&_blockquote]:border-violet-400
        [&_blockquote]:bg-violet-400/5
        [&_blockquote]:px-4 [&_blockquote]:py-3

        [&_hr]:my-7 [&_hr]:border-white/10

        [&_pre]:my-5 [&_pre]:max-w-full
        [&_pre]:overflow-x-auto
        [&_pre]:rounded-xl [&_pre]:border
        [&_pre]:border-white/10
        [&_pre]:bg-[#0B1020]
        [&_pre]:p-4 [&_pre]:text-[13px]
        [&_pre]:leading-6

        [&_pre_code]:!bg-transparent
        [&_pre_code]:!p-0
        [&_pre_code]:text-[13px]

        [&_code:not(pre_code)]:rounded-md
        [&_code:not(pre_code)]:border
        [&_code:not(pre_code)]:border-white/10
        [&_code:not(pre_code)]:bg-white/[0.07]
        [&_code:not(pre_code)]:px-1.5
        [&_code:not(pre_code)]:py-0.5
        [&_code:not(pre_code)]:font-mono
        [&_code:not(pre_code)]:text-cyan-300

        [&_a]:text-cyan-300
        [&_a]:underline
        [&_a]:underline-offset-4

        [&_table]:w-full
        [&_table]:border-collapse
        [&_table]:text-left
        [&_table]:text-sm

        [&_th]:border [&_th]:border-white/10
        [&_th]:bg-white/[0.05]
        [&_th]:px-3 [&_th]:py-3
        [&_th]:font-semibold [&_th]:text-white

        [&_td]:border [&_td]:border-white/10
        [&_td]:px-3 [&_td]:py-3
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-5 w-full overflow-x-auto rounded-xl border border-white/10">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </article>
  );
}
