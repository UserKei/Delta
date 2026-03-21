<script setup lang="ts">
import type { LL1SetDraft } from '../models'

const props = defineProps<{
  nonTerminals: string[]
  firstDraft: LL1SetDraft
  followDraft: LL1SetDraft
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:firstDraft': [value: LL1SetDraft]
  'update:followDraft': [value: LL1SetDraft]
  submit: []
}>()

function updateFirst(nonTerminal: string, value: string) {
  emit('update:firstDraft', { ...props.firstDraft, [nonTerminal]: value })
}

function updateFollow(nonTerminal: string, value: string) {
  emit('update:followDraft', { ...props.followDraft, [nonTerminal]: value })
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-sapphire">Step 2</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          First / Follow sets
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Enter comma-separated set members. Order does not matter.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-sapphire px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-blue disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : 'Validate Sets' }}
      </button>
    </div>

    <div class="mt-6 grid gap-4">
      <div
        v-for="nonTerminal in nonTerminals"
        :key="nonTerminal"
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
      >
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
          {{ nonTerminal }}
        </p>
        <div class="mt-4 grid gap-3 lg:grid-cols-2">
          <label class="grid gap-2">
            <span class="text-sm font-medium text-ctp-text">First({{ nonTerminal }})</span>
            <input
              :value="firstDraft[nonTerminal] ?? ''"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              placeholder="a,@"
              @input="updateFirst(nonTerminal, ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="grid gap-2">
            <span class="text-sm font-medium text-ctp-text">Follow({{ nonTerminal }})</span>
            <input
              :value="followDraft[nonTerminal] ?? ''"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              placeholder="$,b"
              @input="updateFollow(nonTerminal, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
