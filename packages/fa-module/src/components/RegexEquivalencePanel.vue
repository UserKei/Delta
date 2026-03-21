<script setup lang="ts">
defineProps<{
  targetRegex: string
  answerRegex: string
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:targetRegex': [value: string]
  'update:answerRegex': [value: string]
  submit: []
}>()
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-green">Step 1</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Regex equivalence
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Express the same language as the target regex. The judge compares the automata produced by
          both regular expressions rather than matching surface syntax.
        </p>
      </div>
      <div
        class="rounded-full border border-ctp-surface1 bg-ctp-green/12 px-4 py-2 text-xs font-medium text-ctp-green"
      >
        STRING_EQUIVALENCE
      </div>
    </div>

    <div class="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="grid gap-4">
        <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-mauve">
            Validation rule
          </p>
          <p class="mt-3 text-sm leading-6 text-ctp-subtext1">
            Use explicit concatenation with <code class="font-mono text-ctp-text">.</code>.
            Whitespace and malformed operator placement are rejected before equivalence is checked.
          </p>
        </div>

        <label class="grid gap-2">
          <span class="text-sm font-medium text-ctp-text">Target regex</span>
          <input
            :value="targetRegex"
            type="text"
            class="h-12 rounded-2xl border border-ctp-surface1 bg-ctp-crust/55 px-4 font-mono text-sm text-ctp-text transition focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/25"
            placeholder="(a|b)*.a"
            @input="emit('update:targetRegex', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>

      <div class="grid gap-4">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ctp-text">Submitted regex</span>
          <input
            :value="answerRegex"
            type="text"
            class="h-12 rounded-2xl border border-ctp-surface1 bg-ctp-crust/55 px-4 font-mono text-sm text-ctp-text transition focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/25"
            placeholder="((a|b)*).a"
            @input="emit('update:answerRegex', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <div
          class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-mantle text-ctp-text shadow-[0_18px_40px_rgba(30,30,46,0.24)]"
        >
          <div class="border-b border-ctp-surface1 px-5 py-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
              Judge intent
            </p>
            <p class="mt-2 text-sm leading-6 text-ctp-subtext1">
              Equivalent syntax is optional; equivalent language is required.
            </p>
          </div>
          <div class="flex items-center justify-between gap-4 px-5 py-4">
            <p class="max-w-xs text-sm leading-6 text-ctp-subtext1">
              Run the checker when your expression should recognize the same language as the target.
            </p>
            <button
              class="rounded-full bg-ctp-lavender px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-mauve disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
              :disabled="pending"
              @click="emit('submit')"
            >
              {{ pending ? 'Checking...' : 'Run Judge' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
