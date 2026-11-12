"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

type AgentId = "coding-agent" | "bug-fix-agent" | "code-review-agent";

type AgentFilter = "all" | AgentId;
type MekoStatus = "checking" | "connected" | "error";

const navigation = [
  { label: "Overview", href: "#overview", icon: "◫" },
  { label: "AI Agents", href: "#ai-agents", icon: "✳" },
  { label: "Shared Memory", href: "#shared-memory", icon: "◈" },
  { label: "Knowledge Search", href: "#knowledge-search", icon: "⌕" },
];

const agents: {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  accent: string;
}[] = [
  {
    id: "coding-agent",
    name: "Coding Agent",
    description: "Build features with reusable project context.",
    icon: "</>",
    accent: "cyan",
  },
  {
    id: "bug-fix-agent",
    name: "Bug Fix Agent",
    description: "Find root causes and develop reliable fixes.",
    icon: "⌘",
    accent: "blue",
  },
  {
    id: "code-review-agent",
    name: "Code Review Agent",
    description: "Improve code quality, security, and maintainability.",
    icon: "⌥",
    accent: "violet",
  },
];

const agentNames: Record<string, string> = {
  "coding-agent": "Coding Agent",
  "bug-fix-agent": "Bug Fix Agent",
  "code-review-agent": "Code Review Agent",
  "devmemory-ai": "DevMemory Workspace",
};

function extractMemories(payload: unknown): MemoryRecord[] {
  const results: MemoryRecord[] = [];
  const seen = new Set<string>();

  function visit(value: unknown, depth = 0) {
    if (depth > 8 || value == null) return;

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          visit(JSON.parse(trimmed), depth + 1);
        } catch {
          // Ignore non-JSON strings.
        }
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    if (typeof value !== "object") return;

    const record = value as Record<string, unknown>;

    const memoryText =
      typeof record.memory === "string"
        ? record.memory
        : typeof record.text === "string" &&
            (record.id || record.memory_id || record.agent_id)
          ? record.text
          : null;

    if (memoryText) {
      const id =
        String(record.id ?? record.memory_id ?? "") || memoryText.slice(0, 100);

      if (!seen.has(id)) {
        seen.add(id);

        results.push({
          id,
          memory: memoryText,
          score: typeof record.score === "number" ? record.score : undefined,
          created_at:
            typeof record.created_at === "string"
              ? record.created_at
              : typeof record.createdAt === "string"
                ? record.createdAt
                : undefined,
          agent_id:
            typeof record.agent_id === "string" ? record.agent_id : undefined,
        });
      }
    }

    [
      "memories",
      "results",
      "matches",
      "data",
      "items",
      "records",
      "content",
    ].forEach((key) => {
      if (record[key] !== undefined) {
        visit(record[key], depth + 1);
      }
    });
  }

  visit(payload);
  return results;
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAgentName(agentId?: string) {
  return agentId ? (agentNames[agentId] ?? "Shared Memory") : "Shared Memory";
}

export default function Home() {
  const [memoryText, setMemoryText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [memoryFilter, setMemoryFilter] = useState<AgentFilter>("all");

  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [mekoStatus, setMekoStatus] = useState<MekoStatus>("checking");

  const [activeNav, setActiveNav] = useState("Overview");

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const response = await fetch("/api/meko/test", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (active) {
          setMekoStatus(response.ok && data.success ? "connected" : "error");
        }
      } catch {
        if (active) setMekoStatus("error");
      }
    }

    checkConnection();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = memoryText.trim();

    if (!text) {
      setSaveMessage("Please enter memory content.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/meko/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save memory.");
      }

      setSaveMessage("Memory saved successfully!");
      setMemoryText("");
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSearchMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchMessage("Please enter a search query.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");
    setMemories([]);

    try {
      const response = await fetch(
        `/api/meko/memories?query=${encodeURIComponent(query)}&limit=10`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to search shared memory.");
      }

      const results = extractMemories(data.result ?? data);

      setMemories(results);
      setSearchMessage(
        results.length
          ? `Found ${results.length} matching memories.`
          : "No matching memories found. Try a different query.",
      );
    } catch (error) {
      setSearchMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while searching.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  const filteredMemories = useMemo(() => {
    if (memoryFilter === "all") return memories;

    return memories.filter((memory) => memory.agent_id === memoryFilter);
  }, [memories, memoryFilter]);

  const agentActivity = useMemo(
    () =>
      agents.map((agent) => ({
        ...agent,
        count: memories.filter((memory) => memory.agent_id === agent.id).length,
      })),
    [memories],
  );

  const statusLabel =
    mekoStatus === "connected"
      ? "Connected"
      : mekoStatus === "error"
        ? "Connection issue"
        : "Checking...";

  const statusColor =
    mekoStatus === "connected"
      ? "bg-emerald-400"
      : mekoStatus === "error"
        ? "bg-red-400"
        : "bg-amber-400 animate-pulse";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080c13] text-slate-100 selection:bg-cyan-400/30">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.055] blur-[140px]" />
        <div className="absolute -right-48 top-[30%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.045] blur-[140px]" />
        <div className="absolute bottom-[-220px] left-[35%] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.035] blur-[140px]" />
      </div>

      <div className="relative min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col border-r border-white/[0.07] bg-[#0a1019]/95 px-5 py-6 backdrop-blur-2xl lg:flex">
          <a
            href="#overview"
            onClick={() => setActiveNav("Overview")}
            className="mb-11 flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 to-blue-500/10 text-lg font-black text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
              D
            </div>

            <div>
              <p className="text-[17px] font-bold tracking-tight text-white">
                DevMemory<span className="text-cyan-300">.ai</span>
              </p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                Shared AI Memory
              </p>
            </div>
          </a>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const active = activeNav === item.label;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setActiveNav(item.label)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                    active
                      ? "border border-cyan-300/10 bg-cyan-300/[0.08] text-cyan-200"
                      : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                  )}

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                      active
                        ? "bg-cyan-300/10 text-cyan-200"
                        : "text-slate-500 group-hover:text-cyan-200"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="font-medium">{item.label}</span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-transparent p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                  ◈
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  Meko Context Engine
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                <span className="text-xs text-slate-400">{statusLabel}</span>
              </div>

              <p className="mt-3 text-[10px] leading-5 text-slate-600">
                Persistent context for your AI agents.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3 border-t border-white/[0.07] pt-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-bold text-cyan-200">
                KM
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200">
                  DevMemory Workspace
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Personal workspace
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="min-w-0 lg:ml-[258px]">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080c13]/85 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-9">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 font-bold text-cyan-200 lg:hidden">
                  D
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-500">
                    Workspace
                    <span className="mx-2 text-slate-700">/</span>
                    <span className="text-slate-300">{activeNav}</span>
                  </p>
                  <p className="mt-1 hidden text-[10px] text-slate-600 sm:block">
                    Your AI memory workspace
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                <span className="text-[10px] font-medium text-slate-300 sm:text-xs">
                  Meko {statusLabel}
                </span>
              </div>
            </div>
          </header>

          {/* Mobile / tablet navigation */}
          <div className="sticky top-[61px] z-20 border-b border-white/[0.06] bg-[#080c13]/95 px-3 py-2 backdrop-blur-2xl lg:hidden">
            <nav className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navigation.map((item) => {
                const active = activeNav === item.label;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setActiveNav(item.label)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                      active
                        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                        : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 sm:py-9 lg:px-9 lg:py-10">
            {/* Hero */}
            <section id="overview" className="scroll-mt-36">
              <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      Meko-powered context engine
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[46px]">
                    Your AI agents.
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      One shared memory.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                    Teach once. Remember forever. Give your Coding, Bug Fix, and
                    Code Review Agents persistent project knowledge to work
                    smarter together.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Next.js", "React", "TypeScript", "Meko MCP"].map(
                    (technology) => (
                      <span
                        key={technology}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] font-medium text-slate-400 sm:text-xs"
                      >
                        {technology}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </section>

            {/* Meko banner */}
            <section className="mt-9">
              <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-[#102b39] via-[#0e1c2a] to-[#0d1521] p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-10 -top-24 h-60 w-60 rounded-full bg-cyan-400/[0.10] blur-3xl" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-200">
                      ◈
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white sm:text-base">
                        Meko Context Engine
                      </h2>
                      <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
                        A persistent memory layer that helps agents reuse
                        project knowledge, previous solutions, and development
                        context.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 sm:self-center">
                    <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                    <span className="text-xs font-medium text-slate-300">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* AI agents */}
            <section id="ai-agents" className="mt-14 scroll-mt-36">
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Agent workspace
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Meet your AI agents
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                    Three specialized agents. One shared knowledge layer.
                  </p>
                </div>

                <span className="self-start rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-slate-500 sm:self-auto">
                  03 agent interfaces
                </span>
              </div>

              <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                <article className="min-w-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#0d1521] shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:border-cyan-300/30">
                  <div className="border-b border-white/[0.07] bg-gradient-to-r from-cyan-400/[0.09] to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-200">
                        {"</>"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">
                          Coding Agent
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Feature development and coding
                        </p>
                      </div>
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    </div>
                  </div>
                  <div className="min-w-0 p-3 sm:p-4">
                    <CodingAgentChat />
                  </div>
                </article>

                <article className="min-w-0 overflow-hidden rounded-2xl border border-blue-300/15 bg-[#0d1521] shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:border-blue-300/30">
                  <div className="border-b border-white/[0.07] bg-gradient-to-r from-blue-400/[0.09] to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-300/10 text-lg text-blue-200">
                        ⌘
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">
                          Bug Fix Agent
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Root-cause analysis and debugging
                        </p>
                      </div>
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-blue-300" />
                    </div>
                  </div>
                  <div className="min-w-0 p-3 sm:p-4">
                    <BugFixAgentChat />
                  </div>
                </article>

                <article className="min-w-0 overflow-hidden rounded-2xl border border-violet-300/15 bg-[#0d1521] shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:border-violet-300/30 xl:col-span-2 2xl:col-span-1">
                  <div className="border-b border-white/[0.07] bg-gradient-to-r from-violet-400/[0.09] to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-lg text-violet-200">
                        ⌥
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">
                          Code Review Agent
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Code quality and security review
                        </p>
                      </div>
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-violet-300" />
                    </div>
                  </div>
                  <div className="min-w-0 p-3 sm:p-4">
                    <CodeReviewAgentChat />
                  </div>
                </article>
              </div>
            </section>

            {/* Shared memory */}
            <section id="shared-memory" className="mt-14 scroll-mt-36">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Persistent knowledge
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Shared memory
                </h2>
                <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                  Save useful knowledge once. Search and reuse it across agents.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Save form */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0d1521] p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.08] text-xl text-cyan-200">
                      +
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Save a memory
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Add knowledge to persistent context
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveMemory}>
                    <label
                      htmlFor="memoryText"
                      className="mb-2 block text-xs font-medium text-slate-300"
                    >
                      Memory content
                    </label>

                    <textarea
                      id="memoryText"
                      value={memoryText}
                      onChange={(event) => setMemoryText(event.target.value)}
                      placeholder="Example: This project uses Next.js App Router, TypeScript, and Meko for persistent shared memory..."
                      rows={5}
                      maxLength={10000}
                      className="min-h-[130px] w-full resize-y rounded-xl border border-white/[0.09] bg-[#080e17] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[10px] text-slate-600">
                        {memoryText.length}/10,000 characters
                      </span>

                      <button
                        type="submit"
                        disabled={isSaving || !memoryText.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-xs font-bold text-[#06111a] shadow-[0_0_22px_rgba(34,211,238,0.12)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isSaving ? "Saving..." : "Save memory"}
                        <span>→</span>
                      </button>
                    </div>
                  </form>

                  {saveMessage && (
                    <p
                      role="status"
                      className={`mt-4 rounded-xl border px-3 py-3 text-xs ${
                        saveMessage.includes("successfully")
                          ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                          : "border-red-400/20 bg-red-400/[0.06] text-red-300"
                      }`}
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>

                {/* Search form */}
                <div
                  id="knowledge-search"
                  className="scroll-mt-36 rounded-2xl border border-white/[0.08] bg-[#0d1521] p-5 sm:p-6"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.08] text-xl text-cyan-200">
                      ⌕
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Search shared memory
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Retrieve relevant project knowledge
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSearchMemory}>
                    <label
                      htmlFor="searchQuery"
                      className="mb-2 block text-xs font-medium text-slate-300"
                    >
                      Search query
                    </label>

                    <textarea
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Example: How does this project handle authentication?"
                      rows={5}
                      maxLength={5000}
                      className="min-h-[130px] w-full resize-y rounded-xl border border-white/[0.09] bg-[#080e17] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[10px] text-slate-600">
                        Search across persistent Meko memory
                      </span>

                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.09] px-5 py-3 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/[0.16] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isSearching ? "Searching..." : "Search memory"}
                        <span>⌕</span>
                      </button>
                    </div>
                  </form>

                  {searchMessage && (
                    <p
                      role="status"
                      className={`mt-4 rounded-xl border px-3 py-3 text-xs ${
                        searchMessage.startsWith("Found")
                          ? "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200"
                          : searchMessage.startsWith("No matching")
                            ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200"
                            : "border-red-400/20 bg-red-400/[0.06] text-red-300"
                      }`}
                    >
                      {searchMessage}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Search results */}
            {memories.length > 0 && (
              <section className="mt-10">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Retrieved knowledge
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                      Search results
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {memories.length} matching memories returned by Meko
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMemories([]);
                      setSearchMessage("");
                      setMemoryFilter("all");
                    }}
                    className="self-start rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-white sm:self-auto"
                  >
                    Clear results
                  </button>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMemoryFilter("all")}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      memoryFilter === "all"
                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                        : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                    }`}
                  >
                    All agents ({memories.length})
                  </button>

                  {agents.map((agent) => {
                    const count = memories.filter(
                      (memory) => memory.agent_id === agent.id,
                    ).length;

                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setMemoryFilter(agent.id)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                          memoryFilter === agent.id
                            ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                            : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                        }`}
                      >
                        {agent.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {filteredMemories.length > 0 ? (
                    filteredMemories.map((memory, index) => (
                      <article
                        key={memory.id}
                        className="rounded-xl border border-white/[0.07] bg-[#0d1521] p-4 transition hover:border-cyan-300/20 sm:p-5"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/[0.09] text-[10px] font-bold text-cyan-200">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">
                              {getAgentName(memory.agent_id)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {typeof memory.score === "number" && (
                              <span className="rounded-md border border-cyan-300/10 bg-cyan-300/[0.05] px-2 py-1 text-[10px] text-cyan-200">
                                Score: {memory.score.toFixed(3)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-600">
                              {formatDate(memory.created_at)}
                            </span>
                          </div>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                          {memory.memory}
                        </p>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard
                                ?.writeText(memory.memory)
                                .catch(() => {
                                  // Clipboard can be unavailable.
                                });
                            }}
                            className="rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] font-medium text-slate-500 transition hover:border-cyan-300/20 hover:text-cyan-200"
                          >
                            Copy memory
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-10 text-center">
                      <p className="text-sm text-slate-400">
                        No results for this agent in the current search.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMemoryFilter("all")}
                        className="mt-3 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                      >
                        Show all results
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Search activity */}
            {memories.length > 0 && (
              <section className="mt-10">
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Search breakdown
                  </p>
                  <h2 className="mt-2 text-lg font-bold text-white">
                    Agent memory activity
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Based on results from your latest memory search.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {agentActivity.map((agent) => (
                    <div
                      key={agent.id}
                      className="rounded-xl border border-white/[0.07] bg-[#0d1521] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-300">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-cyan-300">
                          {agent.count} results
                        </span>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all"
                          style={{
                            width: `${
                              memories.length
                                ? (agent.count / memories.length) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
                    <p className="text-xs font-medium text-slate-300">
                      Combined results
                    </p>
                    <p className="mt-3 text-2xl font-bold text-cyan-200">
                      {memories.length}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Latest search results
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Agent overview */}
            <section className="mt-14">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Shared context layer
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  One memory. Multiple agents.
                </h2>
                <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
                  Your agents can reuse project knowledge instead of starting
                  from zero every time.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {agents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="rounded-xl border border-white/[0.07] bg-[#0d1521] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] font-mono text-sm font-bold text-cyan-200">
                        {agent.icon}
                      </div>
                      <span className="text-[10px] font-medium text-slate-600">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 text-sm font-semibold text-white">
                      {agent.name}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {agent.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-14 border-t border-white/[0.07] py-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-bold text-slate-300">
                    DevMemory<span className="text-cyan-300">.ai</span>
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Teach once. Remember forever. Build smarter together.
                  </p>
                </div>

                <p className="text-[10px] text-slate-600">
                  Powered by Meko Context Engine
                </p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
