"use client";

import { FormEvent, useState } from "react";

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

    if (description.length < 3 || loading) {
      return;
    }

    const submittedError = errorMessage.trim();
    const submittedCode = relevantCode.trim();

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: [description, submittedError ? `Error: ${submittedError}` : ""]
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
    <section className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Bug Fix Agent</h2>
          <p className="mt-1 text-sm text-slate-400">
            Gemini AI + Meko shared memory
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          API connected
        </span>
      </div>

      <div className="mb-5 min-h-40 space-y-4 rounded-xl border border-white/5 bg-[#0B1020] p-4">
        {messages.length === 0 && (
          <div className="flex min-h-32 flex-col items-center justify-center text-center">
            <div className="mb-3 text-3xl">🐛</div>
            <p className="text-sm font-medium text-slate-300">
              Describe a bug to get started
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The agent will search shared memory and suggest a fix.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[95%] rounded-xl p-3 ${
              message.role === "user"
                ? "ml-auto bg-violet-500/15 text-violet-100"
                : "mr-auto border border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {message.role === "user" ? "You" : "Bug Fix Agent"}
            </p>

            <div className="whitespace-pre-wrap break-words text-sm leading-6">
              {message.content}
            </div>

            {message.role === "assistant" &&
              message.memorySaved !== undefined && (
                <p className="mt-3 border-t border-white/10 pt-2 text-xs text-slate-400">
                  {message.memorySaved
                    ? "✓ Saved to shared Meko memory"
                    : "⚠ Response was not saved to shared memory"}
                </p>
              )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
            Searching shared memory and analyzing the bug...
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={bugDescription}
          onChange={(event) => setBugDescription(event.target.value)}
          placeholder="Describe the bug or unexpected behavior..."
          maxLength={5000}
          required
          rows={3}
          disabled={loading}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
        />

        <textarea
          value={errorMessage}
          onChange={(event) => setErrorMessage(event.target.value)}
          placeholder="Error message (optional)..."
          maxLength={5000}
          rows={2}
          disabled={loading}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
        />

        <textarea
          value={relevantCode}
          onChange={(event) => setRelevantCode(event.target.value)}
          placeholder="Paste relevant code (optional)..."
          maxLength={10000}
          rows={4}
          disabled={loading}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || bugDescription.trim().length < 3}
          className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing bug..." : "Analyze & Fix Bug"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-slate-500">
        Powered by Gemini AI and Meko persistent shared memory
      </p>
    </section>
  );
}
