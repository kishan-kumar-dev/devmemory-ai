"use client";

import { useState } from "react";

const navItems = [
  { name: "Overview", icon: "◫" },
  { name: "Projects", icon: "▣" },
  { name: "AI Agents", icon: "✳" },
  { name: "Shared Memory", icon: "◈" },
  { name: "Knowledge Search", icon: "⌕" },
  { name: "Decision Traces", icon: "⎇" },
];

const agents = [
  {
    name: "Coding Agent",
    description: "Build features using shared project context.",
    icon: "⌘",
    color: "violet",
    status: "Active",
    tasks: "24 tasks",
  },
  {
    name: "Bug Fix Agent",
    description: "Find and fix issues using past solutions.",
    icon: "⌁",
    color: "blue",
    status: "Ready",
    tasks: "12 tasks",
  },
  {
    name: "Review Agent",
    description: "Review code and remember team decisions.",
    icon: "⌗",
    color: "cyan",
    status: "Ready",
    tasks: "18 tasks",
  },
];

const activities = [
  {
    title: "Authentication decision saved",
    detail: "Project Alpha · Decision trace",
    time: "2 min ago",
    icon: "◈",
  },
  {
    title: "Bug fix memory created",
    detail: "API Service · Shared memory",
    time: "18 min ago",
    icon: "✳",
  },
  {
    title: "Coding Agent completed a task",
    detail: "Project Alpha · AI agent",
    time: "35 min ago",
    icon: "⌘",
  },
  {
    title: "New project knowledge indexed",
    detail: "Project Beta · Knowledge base",
    time: "1 hour ago",
    icon: "▣",
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center">{children}</span>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");

  return (
    <main className="min-h-screen bg-[#080B16] text-slate-100">
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
                {item.name === "Shared Memory" && (
                  <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                    128
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-blue-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Meko Context Engine
                </span>
              </div>
              <p className="mb-3 text-xs leading-5 text-slate-500">
                Connect your shared context layer to power AI agents.
              </p>
              <span className="inline-flex rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
                Not connected
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

        {/* Main content */}
        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
          {/* Top bar */}
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
              <button className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-white sm:block">
                ⌕ &nbsp; Search anything
              </button>
              <button
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
              >
                ♧
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-400" />
              </button>
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
                Your AI memory workspace
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Good evening, Kishan <span className="inline-block">✦</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Your agents are ready to build with shared context.
              </p>
            </div>
            <button className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:brightness-110">
              + &nbsp; New Project
            </button>
          </div>

          {/* Context engine banner */}
          <div className="mb-7 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.13] via-[#151A32] to-blue-500/[0.10] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-2xl text-violet-300">
                  ✳
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Connect your Meko Context Engine
                  </p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                    Give your AI agents persistent shared memory, project
                    knowledge and decision history.
                  </p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                    ● Connection required
                  </p>
                </div>
              </div>
              <button className="shrink-0 rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-2.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-400/20">
                Configure connection →
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Projects",
                value: "04",
                change: "Across your workspace",
                icon: "▣",
                color: "violet",
              },
              {
                label: "AI Agents",
                value: "03",
                change: "Ready to collaborate",
                icon: "✳",
                color: "blue",
              },
              {
                label: "Memory Records",
                value: "128",
                change: "Shared knowledge items",
                icon: "◈",
                color: "cyan",
              },
              {
                label: "Decisions Traced",
                value: "56",
                change: "Decisions documented",
                icon: "⎇",
                color: "pink",
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
                <p className="mt-2 text-[11px] text-slate-500">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Agents */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Your AI agents</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Specialized agents powered by shared project memory.
                </p>
              </div>
              <button className="text-xs font-medium text-violet-300 hover:text-violet-200">
                View all →
              </button>
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
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${agent.status === "Active" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border border-slate-400/15 bg-white/[0.04] text-slate-400"}`}
                    >
                      ● {agent.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold">{agent.name}</h4>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-slate-400">
                    {agent.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <span className="text-[11px] text-slate-500">
                      {agent.tasks}
                    </span>
                    <button className="text-xs font-medium text-violet-300 hover:text-white">
                      Open agent →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-[#101525]/80 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Recent activity</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest updates from your workspace.
                  </p>
                </div>
                <button className="text-xs text-violet-300">See all</button>
              </div>
              <div className="space-y-5">
                {activities.map((activity) => (
                  <div key={activity.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm text-violet-300">
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-slate-600">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101525]/80 p-5">
              <div className="mb-5">
                <h3 className="text-sm font-semibold">Memory health</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Your shared knowledge overview.
                </p>
              </div>
              <div className="mb-5 flex items-center gap-4">
                <div
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#8b5cf6 0deg 250deg, #293149 250deg 360deg)",
                  }}
                >
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#101525]">
                    <span className="text-xl font-semibold">69%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Memory organized</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    A preview of your knowledge organization.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Project knowledge", value: "72", width: "72%" },
                  { name: "Bug solutions", value: "34", width: "48%" },
                  { name: "Team decisions", value: "22", width: "32%" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex justify-between text-[11px]">
                      <span className="text-slate-400">{item.name}</span>
                      <span className="text-slate-300">{item.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600">
            <span>© 2026 DevMemory AI · Built for developers</span>
            <span>Persistent context. Smarter agents.</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
