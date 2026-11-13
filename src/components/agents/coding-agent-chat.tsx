"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import MarkdownContent from "@/components/agents/markdown-content";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

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
        body: JSON.stringify({ question: prompt }),
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
    <section className="mb-8 w-full min-w-0 overflow-hidden rounded-2xl border border-violet-400/20 bg-[#101525]/95 shadow-xl shadow-black/20">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-xl font-bold text-violet-200">
            {"</>"}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Coding Agent</h3>
            <p className="mt-1 text-xs text-slate-400">
              Gemini AI + Meko shared memory
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          ● API connected
        </span>
      </header>

      {/* Conversation */}
      <div className="min-h-64 max-h-[75vh] space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
        {messages.length === 0 && !loading && (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-3xl text-violet-300">
              ✦
            </div>

            <h4 className="text-lg font-semibold text-white">
              Meet your Coding Agent
            </h4>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Ask questions about React, Next.js, TypeScript, debugging,
              architecture, and implementation. Your agent retrieves relevant
              shared project memories before generating an answer.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`min-w-0 w-full ${
              message.role === "user" ? "flex justify-end" : "block"
            }`}
          >
            {message.role === "user" ? (
              <div className="max-w-[95%] rounded-2xl rounded-br-md border border-violet-400/20 bg-violet-500/15 px-4 py-3 sm:max-w-[80%]">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                  You
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-violet-50">
                  {message.content}
                </p>
              </div>
            ) : (
              <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-[#0B1020] p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-sm text-violet-300">
                    ✦
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Coding Agent
                    </p>
                    <p className="text-[10px] text-slate-500">
                      AI-generated response
                    </p>
                  </div>
                </div>

                {/* Full-width Markdown response */}
                <div className="w-full min-w-0">
                  <MarkdownContent content={message.content} />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                  <span
                    className={`text-xs ${
                      message.memorySaved === true
                        ? "text-emerald-400"
                        : message.memorySaved === false
                          ? "text-amber-400"
                          : "text-slate-500"
                    }`}
                  >
                    {message.memorySaved === true
                      ? "✓ Saved to shared Meko memory"
                      : message.memorySaved === false
                        ? "⚠ Answer generated, but memory was not saved"
                        : "Generated using shared project context"}
                  </span>
                </div>
              </div>
            )}
          </article>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
            <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            <p className="text-sm text-violet-200">
              Searching shared memory and generating an answer...
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-[#0D1322] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask your coding question..."
            maxLength={5000}
            disabled={loading}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101525] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Ask Agent →"}
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Powered by Gemini AI · Persistent knowledge by Meko
        </p>
      </form>
    </section>
  );
}
