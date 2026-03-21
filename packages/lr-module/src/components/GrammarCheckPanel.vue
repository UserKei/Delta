<script setup lang="ts">
import type { GrammarDraft, ProductionDraft } from '../models'
import { nextProductionId } from '../models'

const props = defineProps<{
  grammarDraft: GrammarDraft
  augmentedDraft: GrammarDraft
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:grammarDraft': [value: GrammarDraft]
  'update:augmentedDraft': [value: GrammarDraft]
  submit: []
}>()

function updateDraft(kind: 'grammarDraft' | 'augmentedDraft', patch: Partial<GrammarDraft>) {
  const current = kind === 'grammarDraft' ? props.grammarDraft : props.augmentedDraft
  if (kind === 'grammarDraft') {
    emit('update:grammarDraft', { ...current, ...patch })
    return
  }

  emit('update:augmentedDraft', { ...current, ...patch })
}

function updateProduction(
  kind: 'grammarDraft' | 'augmentedDraft',
  id: string,
  patch: Partial<ProductionDraft>,
) {
  const current = kind === 'grammarDraft' ? props.grammarDraft : props.augmentedDraft
  const nextValue = {
    ...current,
    productions: current.productions.map(production =>
      production.id === id ? { ...production, ...patch } : production,
    ),
  }

  if (kind === 'grammarDraft') {
    emit('update:grammarDraft', nextValue)
    return
  }

  emit('update:augmentedDraft', nextValue)
}

function addProduction(kind: 'grammarDraft' | 'augmentedDraft') {
  const current = kind === 'grammarDraft' ? props.grammarDraft : props.augmentedDraft
  const nextValue = {
    ...current,
    productions: [
      ...current.productions,
      { id: nextProductionId(current.productions), left: '', right: '' },
    ],
  }

  if (kind === 'grammarDraft') {
    emit('update:grammarDraft', nextValue)
    return
  }

  emit('update:augmentedDraft', nextValue)
}

function removeProduction(kind: 'grammarDraft' | 'augmentedDraft', id: string) {
  const current = kind === 'grammarDraft' ? props.grammarDraft : props.augmentedDraft
  const nextValue = {
    ...current,
    productions: current.productions.filter(production => production.id !== id),
  }

  if (kind === 'grammarDraft') {
    emit('update:grammarDraft', nextValue)
    return
  }

  emit('update:augmentedDraft', nextValue)
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-green">Step 1</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Grammar augmentation
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Enter the raw grammar and the student's augmented grammar side by side.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-green px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-teal disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : 'Validate Augmentation' }}
      </button>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
          Raw grammar
        </p>
        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <input
            :value="grammarDraft.startSymbol"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('grammarDraft', {
                startSymbol: ($event.target as HTMLInputElement).value,
              })
            "
          />
          <input
            :value="grammarDraft.nonTerminals"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('grammarDraft', {
                nonTerminals: ($event.target as HTMLInputElement).value,
              })
            "
          />
          <input
            :value="grammarDraft.terminals"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('grammarDraft', { terminals: ($event.target as HTMLInputElement).value })
            "
          />
        </div>
        <div class="mt-4 grid gap-3">
          <div
            v-for="production in grammarDraft.productions"
            :key="production.id"
            class="grid gap-3 lg:grid-cols-[0.45fr_1fr_auto]"
          >
            <input
              :value="production.left"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              @input="
                updateProduction('grammarDraft', production.id, {
                  left: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <input
              :value="production.right"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              @input="
                updateProduction('grammarDraft', production.id, {
                  right: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <button
              class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
              @click="removeProduction('grammarDraft', production.id)"
            >
              Remove
            </button>
          </div>
        </div>
        <button
          class="mt-4 rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addProduction('grammarDraft')"
        >
          Add production
        </button>
      </div>

      <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-yellow">
          Augmented grammar
        </p>
        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <input
            :value="augmentedDraft.startSymbol"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('augmentedDraft', {
                startSymbol: ($event.target as HTMLInputElement).value,
              })
            "
          />
          <input
            :value="augmentedDraft.nonTerminals"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('augmentedDraft', {
                nonTerminals: ($event.target as HTMLInputElement).value,
              })
            "
          />
          <input
            :value="augmentedDraft.terminals"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateDraft('augmentedDraft', {
                terminals: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </div>
        <div class="mt-4 grid gap-3">
          <div
            v-for="production in augmentedDraft.productions"
            :key="production.id"
            class="grid gap-3 lg:grid-cols-[0.45fr_1fr_auto]"
          >
            <input
              :value="production.left"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              @input="
                updateProduction('augmentedDraft', production.id, {
                  left: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <input
              :value="production.right"
              type="text"
              class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              @input="
                updateProduction('augmentedDraft', production.id, {
                  right: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <button
              class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
              @click="removeProduction('augmentedDraft', production.id)"
            >
              Remove
            </button>
          </div>
        </div>
        <button
          class="mt-4 rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addProduction('augmentedDraft')"
        >
          Add production
        </button>
      </div>
    </div>
  </section>
</template>
