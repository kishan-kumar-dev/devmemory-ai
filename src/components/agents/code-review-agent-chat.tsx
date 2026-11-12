"use client";

import { FormEvent, useState } from "react";

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

      if (!response.ok || !data.success) {
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

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h2 className="text-lg font-semibold text-white">
            Code Review Agent
          </h2>
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
            Meko connected
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-400">
          Review code quality, identify bugs, check security, and retrieve
          shared project knowledge.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="review-language"
            className="mb-1 block text-sm text-gray-300"
          >
            Programming language
          </label>

          <select
            id="review-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#1f2937] p-3 text-sm text-white outline-none focus:border-blue-500"
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
            className="mb-1 block text-sm text-gray-300"
          >
            Code description (optional)
          </label>

          <input
            id="review-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does this code do?"
            maxLength={3000}
            className="w-full rounded-lg border border-white/10 bg-[#1f2937] p-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="review-code"
            className="mb-1 block text-sm text-gray-300"
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
            rows={9}
            className="w-full resize-y rounded-lg border border-white/10 bg-[#1f2937] p-3 font-mono text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.trim().length < 5}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Reviewing code..." : "Review Code"}
        </button>
      </form>

      {messages.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">
            Review conversation
          </h3>

          {messages.map((message, index) => (
            <article
              key={index}
              className={`rounded-lg border p-4 ${
                message.role === "user"
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-white/10 bg-[#1f2937]"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {message.role === "user" ? "You" : "Code Review Agent"}
              </p>

              <div className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-200">
                {message.content}
              </div>

              {message.role === "assistant" &&
                message.memorySaved !== undefined && (
                  <p className="mt-3 text-xs text-emerald-400">
                    {message.memorySaved
                      ? "✓ Saved to shared Meko memory"
                      : "⚠ Review generated, but memory was not saved"}
                  </p>
                )}
            </article>
          ))}
        </div>
      )}

      {loading && (
        <p className="mt-4 animate-pulse text-sm text-blue-400">
          Retrieving shared memory and reviewing your code...
        </p>
      )}
    </section>
  );
}
