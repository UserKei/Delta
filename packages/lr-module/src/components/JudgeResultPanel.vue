<script setup lang="ts">
import type { LRJudgeResult } from '@repo/shared-types'

defineProps<{
  result: LRJudgeResult | null
}>()
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82"
  >
    <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-sapphire">Judge Result</p>
    <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
      Evaluation feedback
    </h2>
    <div
      v-if="result"
      class="mt-5 rounded-[1.5rem] border p-5"
      :class="
        result.pass
          ? 'border-ctp-green/40 bg-ctp-green/12 text-ctp-text'
          : 'border-ctp-red/40 bg-ctp-red/10 text-ctp-text'
      "
    >
      <span class="font-mono text-sm uppercase tracking-[0.2em]">{{
        result.pass ? 'PASS' : result.reasonCode
      }}</span>
      <p class="mt-4 text-sm leading-6">{{ result.message }}</p>
      <pre
        v-if="result.diagnostics"
        class="mt-4 overflow-x-auto rounded-[1.25rem] bg-ctp-crust p-4 text-xs text-ctp-text"
        >{{ JSON.stringify(result.diagnostics, null, 2) }}</pre
      >
    </div>
    <div
      v-else
      class="mt-5 rounded-[1.5rem] border border-dashed border-ctp-surface1 bg-ctp-surface0/45 p-5 text-sm leading-6 text-ctp-subtext1"
    >
      Submit the current step to see validation feedback.
    </div>
  </section>
</template>
