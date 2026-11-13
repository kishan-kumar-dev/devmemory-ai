"use client";

import { FormEvent, useState } from "react";
import MarkdownContent from "@/components/agents/markdown-content";

type Message = {
  role: "user" | "assistant";
  content: string;
  memorySaved?: boolean;
};

export default function CodeReviewAgentChat() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [description, setDescription] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.trim().length < 5 || loading) return;

    const submittedCode = code;
    const submittedLanguage = language;
    const submittedDescription = description;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: `Review this ${submittedLanguage} code:\n\n${submittedCode}`,
      },
    ]);

    setLoading(true);
    setError("");
    setCode("");

    try {
      const response = await fetch("/api/agents/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: submittedCode,
          language: submittedLanguage,
          description: submittedDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.answer) {
        throw new Error(data.error || data.message || "Code review failed.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
          memorySaved: data.memorySaved,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            🔍
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Code Review Agent
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Gemini AI + Meko shared memory
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          API connected
        </span>
      </div>

      <div className="p-4 sm:p-6">
        <p className="mb-5 text-sm leading-6 text-slate-400">
          Review code quality, identify bugs, check security, and retrieve
          shared project knowledge.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="review-language"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Programming language
            </label>

            <select
              id="review-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#0B1020] p-3 text-sm text-white outline-none transition focus:border-blue-400/50 disabled:opacity-50"
            >
              <option>TypeScript</option>
              <option>JavaScript</option>
              <option>React / JSX</option>
              <option>Next.js</option>
              <option>Node.js</option>
              <option>Python</option>
              <option>Java</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="review-description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Code description{" "}
              <span className="text-slate-500">(optional)</span>
            </label>

            <input
              id="review-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this code do?"
              maxLength={3000}
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#0B1020] p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="review-code"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Code to review
            </label>

            <textarea
              id="review-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Paste your code here..."
              required
              minLength={5}
              maxLength={20000}
              rows={10}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] p-4 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 disabled:opacity-50"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 5}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Reviewing code..." : "Review Code"}
          </button>
        </form>
      </div>

      {(messages.length > 0 || loading) && (
        <div className="border-t border-white/10 bg-[#0D1422] p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">
              Review conversation
            </h3>

            <span className="text-xs text-slate-500">
              {messages.length} messages
            </span>
          </div>

          <div className="space-y-6">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`w-full min-w-0 rounded-2xl border p-4 sm:p-6 ${
                  message.role === "user"
                    ? "border-blue-400/20 bg-blue-500/[0.07]"
                    : "border-white/10 bg-[#0B1020]"
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">
                    {message.role === "user" ? "👤" : "🤖"}
                  </span>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {message.role === "user" ? "You" : "Code Review Agent"}
                  </p>
                </div>

                {message.role === "assistant" ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-200">
                    {message.content}
                  </pre>
                )}

                {message.role === "assistant" &&
                  message.memorySaved !== undefined && (
                    <div className="mt-5 border-t border-white/10 pt-3">
                      <p className="text-xs text-slate-400">
                        {message.memorySaved
                          ? "✓ Saved to shared Meko memory"
                          : "⚠ Review generated, but memory was not saved"}
                      </p>
                    </div>
                  )}
              </article>
            ))}

            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 text-sm text-blue-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Retrieving shared memory and reviewing your code...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        <p className="text-center text-xs text-slate-500">
          Powered by Gemini AI and Meko persistent shared memory
        </p>
      </div>
    </section>
  );
}
