<script setup lang="ts">
import { computed } from 'vue'
import type { FiniteAutomata } from '@repo/shared-types'
import { validateEditableAutomaton } from '../models'
import AutomatonFormEditor from './AutomatonFormEditor.vue'
import AutomatonStaticGraphPreview from './AutomatonStaticGraphPreview.vue'

const props = defineProps<{
  stepLabel: string
  title: string
  description: string
  note: string
  modelValue: FiniteAutomata
  targetRegex: string
  pending?: boolean
  actionLabel: string
  previewTitle: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FiniteAutomata]
  submit: []
}>()

const localError = computed(() => validateEditableAutomaton(props.modelValue))
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-peach">
          {{ stepLabel }}
        </p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">{{ title }}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          {{ description }}
          <code class="font-mono">{{ targetRegex }}</code
          >.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-peach px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-yellow disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending || !!localError"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : actionLabel }}
      </button>
    </div>

    <div
      class="mt-5 rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4 text-sm leading-6 text-ctp-subtext1"
    >
      {{ note }}
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
      <AutomatonFormEditor
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <AutomatonStaticGraphPreview
        :automaton="modelValue"
        :title="previewTitle"
        empty-message="Add states and transitions in the form to preview the automaton."
      />
    </div>
  </section>
</template>
