"use client";

import { FormEvent, useState } from "react";
import MarkdownContent from "@/components/agents/markdown-content";

type Message = {
  role: "user" | "assistant";
  content: string;
  memorySaved?: boolean;
};

export default function BugFixAgentChat() {
  const [bugDescription, setBugDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [relevantCode, setRelevantCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const description = bugDescription.trim();

    if (description.length < 3 || loading) return;

    const submittedError = errorMessage.trim();
    const submittedCode = relevantCode.trim();

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: [
          description,
          submittedError ? `Error message:\n${submittedError}` : "",
          submittedCode ? `Relevant code:\n${submittedCode}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ]);

    setBugDescription("");
    setErrorMessage("");
    setRelevantCode("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/agents/bug-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bugDescription: description,
          errorMessage: submittedError || undefined,
          relevantCode: submittedCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.answer) {
        throw new Error(
          data.error || data.message || "The Bug Fix Agent could not respond.",
        );
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
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-2xl">
            🛠️
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Bug Fix Agent</h2>
            <p className="mt-1 text-sm text-slate-400">
              Gemini AI + Meko shared memory
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          API connected
        </span>
      </div>

      <div className="w-full min-w-0 space-y-6 p-4 sm:p-6">
        {messages.length === 0 && !loading && (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0B1020] px-5 py-8 text-center">
            <span className="mb-3 text-3xl">🐛</span>
            <h3 className="text-sm font-semibold text-slate-200">
              Describe a bug to get started
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              The agent searches shared memory and uses project context to
              analyze the issue and suggest a solution.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`w-full min-w-0 rounded-2xl border p-4 sm:p-6 ${
              message.role === "user"
                ? "border-violet-400/20 bg-violet-500/[0.07]"
                : "border-white/10 bg-[#0B1020]"
            }`}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">
                {message.role === "user" ? "👤" : "🤖"}
              </span>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {message.role === "user" ? "You" : "Bug Fix Agent"}
              </p>
            </div>

            {message.role === "assistant" ? (
              <MarkdownContent content={message.content} />
            ) : (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-200">
                {message.content}
              </pre>
            )}

            {message.role === "assistant" &&
              message.memorySaved !== undefined && (
                <div className="mt-5 border-t border-white/10 pt-3">
                  <p className="text-xs text-slate-400">
                    {message.memorySaved
                      ? "✓ Saved to shared Meko memory"
                      : "⚠ Response was not saved to shared memory"}
                  </p>
                </div>
              )}
          </article>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 text-sm text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Searching shared memory and analyzing the bug...
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mx-4 mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300 sm:mx-6"
        >
          {error}
        </div>
      )}

      <div className="border-t border-white/10 bg-[#0D1422] p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="bug-description"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Bug description
            </label>

            <textarea
              id="bug-description"
              value={bugDescription}
              onChange={(event) => setBugDescription(event.target.value)}
              placeholder="Describe the bug or unexpected behavior..."
              maxLength={5000}
              required
              rows={4}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="bug-error-message"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Error message <span className="text-slate-500">(optional)</span>
            </label>

            <textarea
              id="bug-error-message"
              value={errorMessage}
              onChange={(event) => setErrorMessage(event.target.value)}
              placeholder="Paste the error message here..."
              maxLength={5000}
              rows={3}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="bug-relevant-code"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Relevant code <span className="text-slate-500">(optional)</span>
            </label>

            <textarea
              id="bug-relevant-code"
              value={relevantCode}
              onChange={(event) => setRelevantCode(event.target.value)}
              placeholder="Paste the relevant code here..."
              maxLength={10000}
              rows={7}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 font-mono text-xs leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || bugDescription.trim().length < 3}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing bug..." : "Analyze & Fix Bug"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Powered by Gemini AI and Meko persistent shared memory
        </p>
      </div>
    </section>
  );
}
