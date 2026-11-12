"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";

import CodingAgentChat from "@/components/agents/coding-agent-chat";
import BugFixAgentChat from "@/components/agents/bug-fix-agent-chat";
import CodeReviewAgentChat from "@/components/agents/code-review-agent-chat";

type MemoryRecord = {
  id: string;
  memory: string;
  score?: number;
  created_at?: string;
  agent_id?: string;
};

const navItems = [
  { name: "Overview", icon: "◫" },
  { name: "Projects", icon: "▣" },
  { name: "AI Agents", icon: "✳" },
  { name: "Shared Memory", icon: "◈" },
  { name: "Knowledge Search", icon: "⌕" },
  { name: "Decision Traces", icon: "⌇" },
];

const agents = [
  {
    name: "Coding Agent",
    description: "Build features using shared project context.",
    icon: "</>",
    status: "Integrated",
  },
  {
    name: "Bug Fix Agent",
    description:
      "Analyze bugs and retrieve previous solutions using shared memory.",
    icon: "🐛",
    status: "Integrated",
  },
  {
    name: "Code Review Agent",
    description:
      "Review code for bugs, security issues, performance, and maintainability.",
    icon: "⌥",
    status: "Integrated",
  },
];

const subscribe = () => () => {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMemories(response: unknown): MemoryRecord[] {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === undefined || visited.has(current)) continue;

    visited.add(current);

    if (typeof current === "string") {
      try {
        queue.push(JSON.parse(current));
      } catch {
        continue;
      }

      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!isRecord(current)) continue;

    if (Array.isArray(current.results)) {
      return current.results
        .filter(
          (item): item is Record<string, unknown> =>
            isRecord(item) && typeof item.memory === "string",
        )
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : "Unknown ID",
          memory: String(item.memory),
          score: typeof item.score === "number" ? item.score : undefined,
          created_at:
            typeof item.created_at === "string" ? item.created_at : undefined,
          agent_id:
            typeof item.agent_id === "string" ? item.agent_id : undefined,
        }));
    }

    if (current.structuredContent !== undefined) {
      queue.push(current.structuredContent);
    }

    if (current.result !== undefined) {
      queue.push(current.result);
    }

    if (Array.isArray(current.content)) {
      for (const item of current.content) {
        if (isRecord(item) && typeof item.text === "string") {
          queue.push(item.text);
        }
      }
    }
  }

  return [];
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getAgentName(agentId?: string) {
  switch (agentId) {
    case "coding-agent":
      return "Coding Agent";
    case "bug-fix-agent":
      return "Bug Fix Agent";
    case "code-review-agent":
      return "Code Review Agent";
    case "devmemory-ai":
      return "DevMemory Workspace";
    default:
      return agentId || "Unknown Agent";
  }
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");

  const [memoryText, setMemoryText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedMemoryAgent, setSelectedMemoryAgent] =
    useState("devmemory-ai");

  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [searchError, setSearchError] = useState("");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [memoryFilter, setMemoryFilter] = useState("all");

  const filteredMemories = memories.filter((memory) => {
    if (memoryFilter === "all") return true;
    return memory.agent_id === memoryFilter;
  });

  const agentActivity = [
    {
      id: "coding-agent",
      name: "Coding Agent",
      icon: "</>",
    },
    {
      id: "bug-fix-agent",
      name: "Bug Fix Agent",
      icon: "🐛",
    },
    {
      id: "code-review-agent",
      name: "Code Review Agent",
      icon: "⌥",
    },
    {
      id: "devmemory-ai",
      name: "Workspace",
      icon: "◈",
    },
  ].map((agent) => ({
    ...agent,
    count: memories.filter((memory) => memory.agent_id === agent.id).length,
  }));

  const totalSearchMemories = memories.length;

  const currentYear = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => 2026,
  );

  async function handleSaveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = memoryText.trim();

    if (!text || saving) return;

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const response = await fetch("/api/meko/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          agentId: selectedMemoryAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save memory.");
      }

      setSaveMessage(
        `Memory saved successfully under ${getAgentName(selectedMemoryAgent)}!`,
      );
      setMemoryText("");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSearchMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query || searching) return;

    setSearching(true);
    setSearchError("");
    setHasSearched(false);
    setMemories([]);
    setMemoryFilter("all");

    try {
      const params = new URLSearchParams({
        query,
        limit: "10",
      });

      const response = await fetch(`/api/meko/memories?${params.toString()}`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Memory search failed.");
      }

      const results = extractMemories(data.result);

      setMemories(results);
      setHasSearched(true);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Something went wrong while searching.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080B16] text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/3 h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0B0F1D]/90 px-5 py-7 lg:flex">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-xl font-bold shadow-lg shadow-violet-500/20">
              D
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                DevMemory<span className="text-violet-400">.ai</span>
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-slate-500">
                SHARED AI MEMORY
              </p>
            </div>
          </div>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeNav === item.name
                    ? "border border-violet-400/20 bg-violet-500/10 text-violet-200 shadow-sm shadow-violet-950/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.name}

                {item.name === "Shared Memory" && memories.length > 0 && (
                  <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                    {memories.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Meko Context Engine
                </span>
              </div>

              <p className="mb-3 text-xs leading-5 text-slate-400">
                Persistent shared memory for your AI agents.
              </p>

              <span className="inline-flex rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                Connected
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold">
                KM
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">Kishan Modi</p>
                <p className="text-xs text-slate-500">Free workspace</p>
              </div>

              <span className="ml-auto text-slate-500">•••</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 font-bold">
                D
              </div>
              <span className="font-bold">
                DevMemory<span className="text-violet-400">.ai</span>
              </span>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs text-slate-500">
                Workspace / <span className="text-slate-300">{activeNav}</span>
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2.5 text-xs text-emerald-300 sm:block">
                ● Meko connection active
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold lg:hidden">
                KM
              </div>
            </div>
          </header>

          {/* Welcome */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Meko-powered memory
              </div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your AI memory workspace <span className="inline-block">✦</span>
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Teach once. Remember forever. Build smarter together.
              </p>
            </div>

            <span className="text-xs text-slate-500">Developer workspace</span>
          </div>

          {/* Meko banner */}
          <div className="mb-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.13] via-[#151A32] to-blue-500/[0.10] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-2xl text-violet-300">
                  ✳
                </div>

                <div>
                  <p className="text-sm font-semibold">Meko Context Engine</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                    Your application is connected to Meko. Save project
                    knowledge and retrieve it whenever your agents need context.
                  </p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                    ● Meko connection active
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                ✓ Connected
              </span>
            </div>
          </div>

          {/* Agent chats */}
          <div className="mb-8 space-y-6">
            <CodingAgentChat />
            <BugFixAgentChat />
            <CodeReviewAgentChat />
          </div>

          {/* Save and Search */}
          <div className="mb-8 grid gap-5 xl:grid-cols-2">
            {/* Save memory */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#101525]/90 p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl text-violet-300">
                  ◈
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Save a memory</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Store knowledge in your shared Meko memory.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveMemory}>
                <label
                  htmlFor="memory-agent"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Save memory under
                </label>

                <select
                  id="memory-agent"
                  value={selectedMemoryAgent}
                  onChange={(event) =>
                    setSelectedMemoryAgent(event.target.value)
                  }
                  className="mb-4 w-full rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-400/50"
                >
                  <option value="devmemory-ai">DevMemory Workspace</option>
                  <option value="coding-agent">Coding Agent</option>
                  <option value="bug-fix-agent">Bug Fix Agent</option>
                  <option value="code-review-agent">Code Review Agent</option>
                </select>

                <div className="mb-2 flex justify-between gap-2">
                  <label
                    htmlFor="memory-content"
                    className="text-xs font-medium text-slate-300"
                  >
                    Memory content
                  </label>

                  <span className="text-[10px] text-slate-500">
                    {memoryText.length}/10,000 characters
                  </span>
                </div>

                <textarea
                  id="memory-content"
                  value={memoryText}
                  onChange={(event) => setMemoryText(event.target.value)}
                  maxLength={10000}
                  rows={4}
                  required
                  placeholder="Example: Our application uses Next.js App Router and TypeScript. All API routes should validate request data..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0B1020] p-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
                />

                {saveMessage && (
                  <p className="mt-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
                    ✓ {saveMessage}
                  </p>
                )}

                {saveError && (
                  <p className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-xs text-red-300">
                    {saveError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving || !memoryText.trim()}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Memory →"}
                </button>
              </form>
            </div>

            {/* Search memory */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#101525]/90 p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-300">
                  ⌕
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    Search shared memory
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Find previously stored project knowledge.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearchMemory}>
                <label
                  htmlFor="memory-search"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  What do you want to remember?
                </label>

                <input
                  id="memory-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search project knowledge, bug fixes, decisions..."
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10"
                />

                {searchError && (
                  <p className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-xs text-red-300">
                    {searchError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="mt-4 w-full rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {searching ? "Searching..." : "Search Memories →"}
                </button>
              </form>
            </div>
          </div>

          {/* Search results */}
          {hasSearched && (
            <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#101525]/80 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Meko search results</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Results retrieved from your persistent shared memory.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={memoryFilter}
                    onChange={(event) => setMemoryFilter(event.target.value)}
                    aria-label="Filter memories by agent"
                    className="rounded-lg border border-white/10 bg-[#0B1020] px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-400/50"
                  >
                    <option value="all">All Agents</option>
                    <option value="coding-agent">Coding Agent</option>
                    <option value="bug-fix-agent">Bug Fix Agent</option>
                    <option value="code-review-agent">Code Review Agent</option>
                    <option value="devmemory-ai">DevMemory Workspace</option>
                  </select>

                  <span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                    {filteredMemories.length} matches
                  </span>
                </div>
              </div>

              {filteredMemories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                  <p className="text-sm font-medium text-slate-300">
                    No matching memories found
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Try another filter or search phrase, or save some project
                    knowledge.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMemories.map((memory) => (
                    <article
                      key={memory.id}
                      className="rounded-xl border border-white/[0.07] bg-[#0B1020] p-4 transition hover:border-violet-400/20"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                          Shared memory
                        </span>

                        {typeof memory.score === "number" && (
                          <span className="rounded-lg bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                            {(memory.score * 100).toFixed(1)}% relevance
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {memory.memory}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <span>Agent: {getAgentName(memory.agent_id)}</span>
                          <span>{formatDate(memory.created_at)}</span>
                        </div>

                        <button
                          type="button"
                          title="Copy memory ID"
                          onClick={() => {
                            void navigator.clipboard.writeText(memory.id);
                          }}
                          className="max-w-full truncate text-violet-300 transition hover:text-violet-200"
                        >
                          ID: {memory.id.slice(0, 8)}... Copy
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Memory Activity */}
          {hasSearched && (
            <section className="mb-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Agent Memory Activity</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Memories returned by your latest Meko search, grouped by
                  agent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {agentActivity.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setMemoryFilter(agent.id)}
                    aria-pressed={memoryFilter === agent.id}
                    className={`w-full rounded-2xl border p-5 text-left transition hover:border-violet-400/40 ${
                      memoryFilter === agent.id
                        ? "border-violet-400/40 bg-violet-500/10"
                        : "border-white/[0.07] bg-[#101525]/80"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xl text-violet-300">
                        {agent.icon}
                      </span>
                      <span className="rounded-lg border border-violet-400/15 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-300">
                        Meko results
                      </span>
                    </div>

                    <p className="text-2xl font-semibold tabular-nums">
                      {agent.count}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-300">
                      {agent.name}
                    </p>

                    <p className="mt-2 text-[10px] text-slate-500">
                      Memories in latest search
                    </p>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setMemoryFilter("all")}
                  aria-pressed={memoryFilter === "all"}
                  className="w-full rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5 text-left transition hover:border-emerald-400/40"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xl text-emerald-300">◈</span>
                    <span className="text-[10px] text-emerald-300">
                      Combined
                    </span>
                  </div>

                  <p className="text-2xl font-semibold tabular-nums">
                    {totalSearchMemories}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-300">
                    Total memories
                  </p>

                  <p className="mt-2 text-[10px] text-slate-500">
                    Returned by latest search
                  </p>
                </button>
              </div>
            </section>
          )}

          {/* Workspace overview */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Workspace overview</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Live search data and project previews.
                </p>
              </div>

              <span className="text-[10px] text-slate-500">
                Preview data · Not live metrics
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total Projects",
                  value: "04",
                  change: "Preview data",
                  icon: "▣",
                },
                {
                  label: "AI Agents",
                  value: "03",
                  change: "3 agent interfaces integrated",
                  icon: "✳",
                },
                {
                  label: "Latest Search Matches",
                  value: hasSearched ? String(memories.length) : "—",
                  change: hasSearched
                    ? "Actual Meko search results"
                    : "Use memory search below",
                  icon: "◈",
                },
                {
                  label: "Decisions Traced",
                  value: "—",
                  change: "Not connected yet",
                  icon: "⌇",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/[0.07] bg-[#101525]/80 p-5 transition hover:-translate-y-1 hover:border-violet-400/25"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400">
                      {stat.label}
                    </p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-lg text-violet-300">
                      {stat.icon}
                    </span>
                  </div>

                  <p className="text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Agents */}
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Your AI agents</h3>
              <p className="mt-1 text-xs text-slate-500">
                Specialized agents powered by shared project memory.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-2xl border border-white/[0.07] bg-[#101525]/80 p-5 transition hover:border-violet-400/25 hover:bg-[#131A2D]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/15 bg-gradient-to-br from-violet-500/20 to-blue-500/10 text-xl text-violet-200">
                      {agent.icon}
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                      {agent.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold">{agent.name}</h4>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-slate-400">
                    {agent.description}
                  </p>

                  <div className="mt-5 border-t border-white/[0.07] pt-4">
                    <span className="text-[11px] text-slate-500">
                      Available in agent chat above · Gemini free-tier quota may
                      limit requests
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.07] to-blue-500/[0.04] p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl text-violet-300">✳</span>
              <h3 className="text-sm font-semibold">About DevMemory AI</h3>
            </div>

            <p className="max-w-3xl text-xs leading-6 text-slate-400">
              DevMemory AI is shared memory infrastructure for coding agents. It
              helps agents retain project knowledge, remember bug fixes, and
              reuse development decisions. Meko provides the persistent context
              layer so agents can retrieve useful information instead of
              starting from zero every time.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Next.js", "React", "TypeScript", "Meko MCP", "YugabyteDB"].map(
                (technology) => (
                  <span
                    key={technology}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-slate-300"
                  >
                    {technology}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600">
            <span>© {currentYear} DevMemory AI · Built for developers</span>
            <span>Persistent context. Smarter agents.</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
