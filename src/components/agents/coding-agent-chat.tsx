"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  memorySaved?: boolean;
};

export default function CodingAgentChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = question.trim();

    if (!prompt || loading) return;

    setMessages((previous) => [...previous, { role: "user", content: prompt }]);

    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/agents/coding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.answer) {
        throw new Error(
          data.error || data.message || `Request failed (${response.status})`,
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
    <section className="mb-8 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#101525]/95">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-xl text-violet-200">
            {"</>"}
          </div>

          <div>
            <h3 className="text-sm font-semibold">Coding Agent</h3>
            <p className="mt-1 text-xs text-slate-500">
              Gemini AI + Meko shared memory
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-medium text-emerald-300">
          API connected
        </span>
      </div>

      {/* Chat messages */}
      <div className="min-h-48 max-h-[480px] space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && !loading && (
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            <div className="mb-3 text-3xl text-violet-300">✦</div>

            <p className="text-sm font-medium text-slate-200">
              Ask your Coding Agent
            </p>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
              Ask coding questions. The agent retrieves relevant project
              memories from Meko before generating its answer.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                message.role === "user"
                  ? "bg-violet-600/20 text-violet-100"
                  : "border border-white/[0.07] bg-[#0B1020] text-slate-200"
              }`}
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {message.role === "user" ? "You" : "Coding Agent"}
              </p>

              <p className="whitespace-pre-wrap text-sm leading-6">
                {message.content}
              </p>

              {message.role === "assistant" && (
                <p className="mt-3 border-t border-white/[0.07] pt-2 text-[10px] text-slate-500">
                  {message.memorySaved === true
                    ? "✓ Saved to shared Meko memory"
                    : message.memorySaved === false
                      ? "⚠ Answer generated, but memory was not saved"
                      : "Generated using shared project context"}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="rounded-xl border border-violet-400/10 bg-[#0B1020] p-4 text-xs text-violet-200">
            <span className="animate-pulse">
              Searching shared memory and generating an answer...
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-300"
          >
            {error}
          </div>
        )}
      </div>

      {/* Question input */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 border-t border-white/[0.07] p-4 sm:flex-row"
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a coding question..."
          maxLength={5000}
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask Agent →"}
        </button>
      </form>
    </section>
  );
}
