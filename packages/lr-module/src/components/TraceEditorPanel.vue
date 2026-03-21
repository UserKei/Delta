<script setup lang="ts">
import type { LRTraceDraftRow } from '../models'
import { nextTraceDraftId } from '../models'

const props = defineProps<{
  input: string
  rows: LRTraceDraftRow[]
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:input': [value: string]
  'update:rows': [value: LRTraceDraftRow[]]
  submit: []
}>()

function updateRow(id: string, patch: Partial<LRTraceDraftRow>) {
  emit(
    'update:rows',
    props.rows.map(row => (row.id === id ? { ...row, ...patch } : row)),
  )
}

function addRow() {
  emit('update:rows', [
    ...props.rows,
    {
      id: nextTraceDraftId(props.rows),
      stateStack: '',
      symbolStack: '',
      input: '',
      action: '',
      popCount: '0',
      pushSymbol: '',
      pushState: '',
    },
  ])
}

function removeRow(id: string) {
  emit(
    'update:rows',
    props.rows.filter(row => row.id !== id),
  )
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-pink">Step 4</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">Parsing trace</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Record state stack, symbol stack, remaining input, and the shift/reduce action for each
          step.
        </p>
      </div>
      <div class="flex gap-3">
        <button
          class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addRow"
        >
          Add row
        </button>
        <button
          class="rounded-full bg-ctp-pink px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-mauve disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
          :disabled="pending"
          @click="emit('submit')"
        >
          {{ pending ? 'Checking...' : 'Validate Trace' }}
        </button>
      </div>
    </div>

    <label class="mt-6 grid gap-2">
      <span class="text-sm font-medium text-ctp-text">Input string</span>
      <input
        :value="input"
        type="text"
        class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
        @input="emit('update:input', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="mt-6 grid gap-4">
      <div
        v-for="row in rows"
        :key="row.id"
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-pink">
            {{ row.id }}
          </p>
          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeRow(row.id)"
          >
            Remove
          </button>
        </div>
        <div class="mt-4 grid gap-3 xl:grid-cols-3">
          <input
            :value="row.stateStack"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { stateStack: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.symbolStack"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { symbolStack: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.input"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { input: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.action"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80 xl:col-span-2"
            @input="updateRow(row.id, { action: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.popCount"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { popCount: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.pushSymbol"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { pushSymbol: ($event.target as HTMLInputElement).value })"
          />
          <input
            :value="row.pushState"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="updateRow(row.id, { pushState: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>
    </div>
  </section>
</template>
