<template>
  <main class="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-6 py-16">
    <section class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div class="space-y-6">
        <p class="font-mono text-sm uppercase tracking-[0.28em] text-emerald-700">
          Formal Language Studio
        </p>
        <h1 class="max-w-3xl text-5xl font-semibold leading-tight text-slate-950">
          Build and judge finite automata step by step.
        </h1>
        <p class="max-w-2xl text-lg text-slate-600">
          This workspace now includes rough teaching modules for finite automata and LL(1)
          predictive parsing, with the same package-oriented shell.
        </p>
        <div class="flex flex-wrap gap-4">
          <RouterLink
            to="/fa"
            class="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open FA Judge
          </RouterLink>
          <RouterLink
            to="/ll1"
            class="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Open LL1 Judge
          </RouterLink>
          <RouterLink
            to="/lr"
            class="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Open LR Judge
          </RouterLink>
        </div>
      </div>

      <div
        class="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <div class="grid gap-4">
          <div class="rounded-3xl bg-slate-950 p-5 text-white">
            <p class="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">Step 1</p>
            <p class="mt-3 text-xl font-medium">输入正则并验证语言等价性</p>
          </div>
          <div class="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <p class="font-mono text-xs uppercase tracking-[0.24em] text-amber-600">Step 2</p>
            <p class="mt-3 text-xl font-medium text-slate-900">绘制 NFA 并检查 Thompson 结构</p>
          </div>
          <div
            class="rounded-3xl bg-emerald-50 p-5 text-sm text-emerald-900 ring-1 ring-emerald-200"
          >
            LL(1) is now live as a second rough module with grammar, set, table, and trace steps.
          </div>
          <div class="rounded-3xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
            LR now has a rough shared shell for LR(0) and SLR(1), with mode-aware table checking.
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
