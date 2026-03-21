<script setup lang="ts">
import type { FAJudgeResult } from '@repo/shared-types'

defineProps<{
  result: FAJudgeResult | null
}>()
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82"
  >
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-sapphire">
          Judge Result
        </p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Evaluation feedback
        </h2>
      </div>
      <span
        class="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
        :class="
          !result
            ? 'border-ctp-surface1 bg-ctp-surface0/60 text-ctp-subtext1'
            : result.pass
              ? 'border-ctp-green/40 bg-ctp-green/14 text-ctp-green'
              : 'border-ctp-red/40 bg-ctp-red/14 text-ctp-red'
        "
      >
        {{ result ? (result.pass ? 'Pass' : 'Fail') : 'Pending' }}
      </span>
    </div>

    <div v-if="result" class="mt-5 space-y-4 text-sm text-ctp-subtext1">
      <p>{{ result.message }}</p>
      <div
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-mantle p-4 font-mono text-xs text-ctp-text shadow-[0_18px_40px_rgba(30,30,46,0.2)]"
      >
        <p><span class="text-ctp-subtext0">reasonCode</span> = {{ result.reasonCode }}</p>
        <pre
          v-if="result.diagnostics"
          class="mt-3 overflow-x-auto whitespace-pre-wrap rounded-[1rem] bg-ctp-crust p-3"
          >{{ JSON.stringify(result.diagnostics, null, 2) }}</pre
        >
      </div>
    </div>

    <p v-else class="mt-5 text-sm leading-6 text-ctp-subtext1">
      Submit an answer to see pass/fail status and diagnostics.
    </p>
  </section>
</template>
