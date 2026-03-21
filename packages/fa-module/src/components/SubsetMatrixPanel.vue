<script setup lang="ts">
import { computed, watch } from 'vue'
import type { SubsetRowDraft } from '../models'
import { nextSubsetRowId, syncSubsetDraftAlphabet } from '../models'

const props = defineProps<{
  targetRegex: string
  alphabet: string[]
  rows: SubsetRowDraft[]
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:rows': [value: SubsetRowDraft[]]
  submit: []
}>()

watch(
  () => props.alphabet,
  alphabet => {
    emit('update:rows', syncSubsetDraftAlphabet(props.rows, alphabet))
  },
  { deep: true },
)

const hasAlphabet = computed(() => props.alphabet.length > 0)

function updateRow(rowId: string, patch: Partial<SubsetRowDraft>) {
  emit(
    'update:rows',
    props.rows.map(row => (row.id === rowId ? { ...row, ...patch } : row)),
  )
}

function updateTransition(rowId: string, symbol: string, value: string) {
  emit(
    'update:rows',
    props.rows.map(row =>
      row.id === rowId
        ? {
            ...row,
            transitions: {
              ...row.transitions,
              [symbol]: value,
            },
          }
        : row,
    ),
  )
}

function addRow() {
  emit('update:rows', [
    ...props.rows,
    {
      id: nextSubsetRowId(props.rows),
      stateInput: '',
      isStart: false,
      isEnd: false,
      transitions: Object.fromEntries(props.alphabet.map(symbol => [symbol, ''])),
    },
  ])
}

function removeRow(rowId: string) {
  emit(
    'update:rows',
    props.rows.filter(row => row.id !== rowId),
  )
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-sapphire">Step 3</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Subset-construction table
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Fill the reachable DFA subset states for <code class="font-mono">{{ targetRegex }}</code
          >.
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
          class="rounded-full bg-ctp-sapphire px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-blue disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
          :disabled="pending"
          @click="emit('submit')"
        >
          {{ pending ? 'Checking...' : 'Validate Table' }}
        </button>
      </div>
    </div>

    <div
      class="mt-5 rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4 text-sm leading-6 text-ctp-subtext1"
    >
      Each row represents one DFA state set. Use comma-separated NFA state ids like
      <code class="font-mono text-ctp-text">q0,q1</code>.
    </div>

    <div
      v-if="!hasAlphabet"
      class="mt-5 rounded-[1.5rem] border border-ctp-yellow/40 bg-ctp-yellow/12 p-4 text-sm leading-6 text-ctp-text"
    >
      The current NFA has no non-epsilon alphabet symbols yet. Update Step 2 first if the table
      should expose transition columns.
    </div>

    <div class="mt-6 grid gap-4">
      <div
        v-for="row in rows"
        :key="row.id"
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
            {{ row.id }}
          </p>
          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeRow(row.id)"
          >
            Remove
          </button>
        </div>

        <div class="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_repeat(2,minmax(0,0.4fr))]">
          <input
            :value="row.stateInput"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            placeholder="q0,q1"
            @input="updateRow(row.id, { stateInput: ($event.target as HTMLInputElement).value })"
          />
          <label
            class="flex items-center gap-3 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-subtext1 dark:bg-ctp-mantle/80"
          >
            <input
              :checked="row.isStart"
              type="checkbox"
              @change="updateRow(row.id, { isStart: ($event.target as HTMLInputElement).checked })"
            />
            Start
          </label>
          <label
            class="flex items-center gap-3 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-subtext1 dark:bg-ctp-mantle/80"
          >
            <input
              :checked="row.isEnd"
              type="checkbox"
              @change="updateRow(row.id, { isEnd: ($event.target as HTMLInputElement).checked })"
            />
            Accepting
          </label>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label v-for="symbol in alphabet" :key="`${row.id}-${symbol}`" class="grid gap-2">
            <span class="text-sm font-medium text-ctp-text">On {{ symbol }}</span>
            <input
              :value="row.transitions[symbol] ?? ''"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              placeholder="q2,q3"
              @input="updateTransition(row.id, symbol, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
