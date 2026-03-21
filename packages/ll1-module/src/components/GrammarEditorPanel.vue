<script setup lang="ts">
import type { GrammarDraft, ProductionDraft } from '../models'
import { nextProductionId } from '../models'

const props = defineProps<{
  modelValue: GrammarDraft
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: GrammarDraft]
  submit: []
}>()

function updateDraft(patch: Partial<GrammarDraft>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function updateProduction(id: string, patch: Partial<ProductionDraft>) {
  emit('update:modelValue', {
    ...props.modelValue,
    productions: props.modelValue.productions.map(production =>
      production.id === id ? { ...production, ...patch } : production,
    ),
  })
}

function addProduction() {
  emit('update:modelValue', {
    ...props.modelValue,
    productions: [
      ...props.modelValue.productions,
      {
        id: nextProductionId(props.modelValue.productions),
        left: '',
        right: '',
      },
    ],
  })
}

function removeProduction(id: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    productions: props.modelValue.productions.filter(production => production.id !== id),
  })
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
          Grammar definition
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Declare the grammar symbols first, then enter productions row by row.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-green px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-teal disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : 'Validate Grammar' }}
      </button>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-ctp-text">Start symbol</span>
        <input
          :value="modelValue.startSymbol"
          type="text"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          @input="updateDraft({ startSymbol: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="grid gap-2">
        <span class="text-sm font-medium text-ctp-text">Non-terminals</span>
        <input
          :value="modelValue.nonTerminals"
          type="text"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          placeholder="S,A"
          @input="updateDraft({ nonTerminals: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="grid gap-2">
        <span class="text-sm font-medium text-ctp-text">Terminals</span>
        <input
          :value="modelValue.terminals"
          type="text"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          placeholder="a,b"
          @input="updateDraft({ terminals: ($event.target as HTMLInputElement).value })"
        />
      </label>
    </div>

    <div
      class="mt-6 rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4 text-sm leading-6 text-ctp-subtext1"
    >
      Use comma-separated symbol lists. Productions should split symbols with spaces, for example
      <code class="font-mono text-ctp-text">S -> a A</code>.
    </div>

    <div class="mt-6 grid gap-4">
      <div
        v-for="production in modelValue.productions"
        :key="production.id"
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
            {{ production.id }}
          </p>
          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeProduction(production.id)"
          >
            Remove
          </button>
        </div>
        <div class="mt-4 grid gap-3 lg:grid-cols-[0.4fr_1fr]">
          <input
            :value="production.left"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            placeholder="Left"
            @input="
              updateProduction(production.id, { left: ($event.target as HTMLInputElement).value })
            "
          />
          <input
            :value="production.right"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            placeholder="a A"
            @input="
              updateProduction(production.id, { right: ($event.target as HTMLInputElement).value })
            "
          />
        </div>
      </div>
    </div>

    <button
      class="mt-6 rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
      @click="addProduction"
    >
      Add production
    </button>
  </section>
</template>
