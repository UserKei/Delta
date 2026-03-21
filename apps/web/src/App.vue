<template>
  <div class="min-h-screen">
    <header class="border-b border-border/70 bg-white/70 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <RouterLink
          to="/"
          class="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-slate-800"
        >
          Delta Automata Lab
        </RouterLink>
        <nav class="flex items-center gap-2 text-sm">
          <RouterLink
            to="/"
            class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-900 hover:text-white"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/fa"
            class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-900 hover:text-white"
          >
            FA Judge
          </RouterLink>
          <RouterLink
            to="/ll1"
            class="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-900 hover:text-white"
          >
            LL1 Judge
          </RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>
