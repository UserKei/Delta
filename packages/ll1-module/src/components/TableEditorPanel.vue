<script setup lang="ts">
import type { LL1Table } from '@repo/shared-types'

const props = defineProps<{
  modelValue: LL1Table
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LL1Table]
  submit: []
}>()

function updateCell(nonTerminal: string, terminal: string, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    table: {
      ...props.modelValue.table,
      [nonTerminal]: {
        ...props.modelValue.table[nonTerminal],
        [terminal]: value,
      },
    },
  })
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-peach">Step 3</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Predictive parsing table
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Fill each LL(1) cell with a production like <code class="font-mono">S -> a A</code>.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-peach px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-yellow disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : 'Validate Table' }}
      </button>
    </div>

    <div
      class="mt-6 overflow-x-auto rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-4"
    >
      <table class="min-w-full border-separate border-spacing-3">
        <thead>
          <tr>
            <th class="min-w-32 text-left text-sm text-ctp-subtext1">NT \\ T</th>
            <th
              v-for="terminal in modelValue.terminals"
              :key="terminal"
              class="min-w-40 text-left text-sm text-ctp-subtext1"
            >
              {{ terminal }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="nonTerminal in modelValue.nonTerminals" :key="nonTerminal">
            <td class="font-mono text-sm font-semibold text-ctp-text">{{ nonTerminal }}</td>
            <td v-for="terminal in modelValue.terminals" :key="`${nonTerminal}-${terminal}`">
              <input
                :value="modelValue.table[nonTerminal]?.[terminal] ?? ''"
                type="text"
                class="h-11 w-full rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="
                  updateCell(nonTerminal, terminal, ($event.target as HTMLInputElement).value)
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
