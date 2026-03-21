<script setup lang="ts">
import type { LRStateDraft, LRTransitionDraft } from '../models'
import { nextStateDraftId, nextTransitionDraftId } from '../models'

const props = defineProps<{
  states: LRStateDraft[]
  transitions: LRTransitionDraft[]
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:states': [value: LRStateDraft[]]
  'update:transitions': [value: LRTransitionDraft[]]
  submit: []
}>()

function updateState(id: string, patch: Partial<LRStateDraft>) {
  emit(
    'update:states',
    props.states.map(state => (state.id === id ? { ...state, ...patch } : state)),
  )
}
function addState() {
  emit('update:states', [
    ...props.states,
    { id: nextStateDraftId(props.states), itemsText: '', isAccepting: false },
  ])
}
function removeState(id: string) {
  emit(
    'update:states',
    props.states.filter(state => state.id !== id),
  )
  emit(
    'update:transitions',
    props.transitions.filter(
      transition =>
        transition.source !== id.replace(/^state-/, '') &&
        transition.target !== id.replace(/^state-/, ''),
    ),
  )
}
function updateTransition(id: string, patch: Partial<LRTransitionDraft>) {
  emit(
    'update:transitions',
    props.transitions.map(transition =>
      transition.id === id ? { ...transition, ...patch } : transition,
    ),
  )
}
function addTransition() {
  emit('update:transitions', [
    ...props.transitions,
    { id: nextTransitionDraftId(props.transitions), source: '', target: '', label: '' },
  ])
}
function removeTransition(id: string) {
  emit(
    'update:transitions',
    props.transitions.filter(transition => transition.id !== id),
  )
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
          Canonical collection DFA
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Enter states with their item closures and list the transitions explicitly.
        </p>
      </div>
      <button
        class="rounded-full bg-ctp-sapphire px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-blue disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
        :disabled="pending"
        @click="emit('submit')"
      >
        {{ pending ? 'Checking...' : 'Validate DFA' }}
      </button>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_0.92fr]">
      <div class="grid gap-4">
        <div
          v-for="state in states"
          :key="state.id"
          class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-lavender">
              {{ state.id }}
            </p>
            <button
              class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
              @click="removeState(state.id)"
            >
              Remove
            </button>
          </div>
          <div class="mt-4 grid gap-3">
            <label class="flex items-center gap-3 text-sm text-ctp-subtext1">
              <input
                :checked="state.isAccepting"
                type="checkbox"
                @change="
                  updateState(state.id, {
                    isAccepting: ($event.target as HTMLInputElement).checked,
                  })
                "
              />
              Accepting state
            </label>
            <textarea
              :value="state.itemsText"
              class="min-h-36 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 py-3 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
              placeholder="S' -> • S"
              @input="
                updateState(state.id, { itemsText: ($event.target as HTMLTextAreaElement).value })
              "
            ></textarea>
          </div>
        </div>
        <button
          class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addState"
        >
          Add state
        </button>
      </div>

      <div class="grid gap-4">
        <div
          class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4 text-sm leading-6 text-ctp-subtext1"
        >
          One item per line. Use <code class="font-mono text-ctp-text">•</code> to mark the dot
          position.
        </div>
        <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
          <div class="flex items-center justify-between gap-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-yellow">
              Transitions
            </p>
            <button
              class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-3 py-1.5 text-xs font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
              @click="addTransition"
            >
              Add transition
            </button>
          </div>
          <div class="mt-4 grid gap-3">
            <div
              v-for="transition in transitions"
              :key="transition.id"
              class="grid gap-3 lg:grid-cols-[0.35fr_0.35fr_0.35fr_auto]"
            >
              <input
                :value="transition.source"
                type="text"
                class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="
                  updateTransition(transition.id, {
                    source: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <input
                :value="transition.target"
                type="text"
                class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="
                  updateTransition(transition.id, {
                    target: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <input
                :value="transition.label"
                type="text"
                class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
                @input="
                  updateTransition(transition.id, {
                    label: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <button
                class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
                @click="removeTransition(transition.id)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-sapphire">Preview</p>
          <div class="mt-4 grid gap-3">
            <div
              v-for="state in states"
              :key="`preview-${state.id}`"
              class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-base/60 p-4 dark:bg-ctp-mantle/80"
            >
              <div class="flex items-center justify-between gap-4">
                <span class="font-mono text-sm text-ctp-text">{{
                  state.id.replace(/^state-/, 'I')
                }}</span>
                <span
                  v-if="state.isAccepting"
                  class="rounded-full border border-ctp-green/40 bg-ctp-green/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ctp-green"
                  >Accept</span
                >
              </div>
              <pre class="mt-3 whitespace-pre-wrap text-xs text-ctp-subtext1">{{
                state.itemsText || '(empty)'
              }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
