<script setup lang="ts">
import { ActionType, type LRAction, type LRTable } from '@repo/shared-types'

const props = defineProps<{
  modelValue: LRTable
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LRTable]
  submit: []
}>()

function updateAction(stateId: string, terminal: string, value: string) {
  const nextRow = { ...(props.modelValue.action[stateId] ?? {}) }
  const parsed = parseAction(value)

  if (parsed) {
    nextRow[terminal] = parsed
  } else {
    delete nextRow[terminal]
  }

  emit('update:modelValue', {
    ...props.modelValue,
    action: {
      ...props.modelValue.action,
      [stateId]: nextRow,
    },
  })
}

function updateGoto(stateId: string, nonTerminal: string, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    goto: {
      ...props.modelValue.goto,
      [stateId]: {
        ...props.modelValue.goto[stateId],
        [nonTerminal]: value.trim(),
      },
    },
  })
}

function stringifyAction(action?: LRTable['action'][string][string]): string {
  if (!action) return ''
  if (action.type === ActionType.ACCEPT) return 'acc'
  return `${action.type}${action.value ?? ''}`
}

function parseAction(value: string): LRAction | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'acc') return { type: ActionType.ACCEPT }
  if (normalized.startsWith('s')) return { type: ActionType.SHIFT, value: normalized.slice(1) }
  if (normalized.startsWith('r'))
    return { type: ActionType.REDUCE, value: Number(normalized.slice(1)) }
  return null
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
          ACTION / GOTO table
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Use <code class="font-mono">s1</code>, <code class="font-mono">r2</code>, and
          <code class="font-mono">acc</code> in ACTION cells.
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
            <th class="min-w-24 text-left text-sm text-ctp-subtext1">State</th>
            <th
              v-for="terminal in modelValue.terminals"
              :key="terminal"
              class="min-w-28 text-left text-sm text-ctp-subtext1"
            >
              A {{ terminal }}
            </th>
            <th
              v-for="nonTerminal in modelValue.nonTerminals"
              :key="nonTerminal"
              class="min-w-28 text-left text-sm text-ctp-subtext1"
            >
              G {{ nonTerminal }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stateId in Object.keys(modelValue.action).sort((a, b) => Number(a) - Number(b))"
            :key="stateId"
          >
            <td class="font-mono text-sm font-semibold text-ctp-text">{{ stateId }}</td>
            <td v-for="terminal in modelValue.terminals" :key="`${stateId}-${terminal}`">
              <input
                :value="stringifyAction(modelValue.action[stateId]?.[terminal])"
                type="text"
                class="h-11 w-full rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="updateAction(stateId, terminal, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td v-for="nonTerminal in modelValue.nonTerminals" :key="`${stateId}-${nonTerminal}`">
              <input
                :value="modelValue.goto[stateId]?.[nonTerminal] ?? ''"
                type="text"
                class="h-11 w-full rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="updateGoto(stateId, nonTerminal, ($event.target as HTMLInputElement).value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
