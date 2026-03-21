<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  augmentGrammar,
  buildCanonicalCollection,
  buildTable,
  computeFirst,
  computeFollow,
} from '@repo/core'
import { LRMode, type LRJudgeResult } from '@repo/shared-types'
import DfaEditorPanel from '../components/DfaEditorPanel.vue'
import GrammarCheckPanel from '../components/GrammarCheckPanel.vue'
import JudgeResultPanel from '../components/JudgeResultPanel.vue'
import TableEditorPanel from '../components/TableEditorPanel.vue'
import TraceEditorPanel from '../components/TraceEditorPanel.vue'
import {
  buildAutomatonDraft,
  buildGrammarDraft,
  createStarterAugmentedGrammarDraft,
  createStarterAutomatonDraft,
  createStarterGrammarDraft,
  createStarterTableDraft,
  createStarterTraceDraft,
  LR_STEP_META,
  parseAutomatonDraft,
  parseGrammarDraft,
  parseTraceDraftRows,
  type GrammarDraft,
  type LRStateDraft,
  type LRStepKey,
  type LRTraceDraftRow,
  type LRTransitionDraft,
} from '../models'
import { lrJudgeService } from '../services/service'

const mode = ref<LRMode>(LRMode.LR0)
const activeStep = ref<LRStepKey>('grammar-check')
const grammarDraft = ref(createStarterGrammarDraft())
const augmentedDraft = ref(createStarterAugmentedGrammarDraft())
const automatonDraft = ref(createStarterAutomatonDraft())
const tableDraft = ref(createStarterTableDraft())
const traceState = ref(createStarterTraceDraft())

const results = ref<Record<LRStepKey, LRJudgeResult | null>>({
  'grammar-check': null,
  'dfa-isomorphism': null,
  'table-check': null,
  'trace-match': null,
})
const stale = ref<Record<LRStepKey, boolean>>({
  'grammar-check': false,
  'dfa-isomorphism': false,
  'table-check': false,
  'trace-match': false,
})
const pendingStep = ref<LRStepKey | null>(null)
const localMessage = ref('')

const grammar = computed(() => parseGrammarDraft(grammarDraft.value))
const augmentedGrammar = computed(() => parseGrammarDraft(augmentedDraft.value))
const automaton = computed(() =>
  parseAutomatonDraft(automatonDraft.value.states, automatonDraft.value.transitions),
)
const currentStep = computed(() => LR_STEP_META.find(step => step.key === activeStep.value)!)
const currentResult = computed(() => results.value[activeStep.value])

function markStaleFrom(stepKey: LRStepKey) {
  const startIndex = LR_STEP_META.findIndex(step => step.key === stepKey)
  if (startIndex < 0) return
  for (const step of LR_STEP_META.slice(startIndex + 1)) {
    results.value[step.key] = null
    stale.value[step.key] = true
  }
}

function clearStale(stepKey: LRStepKey) {
  stale.value[stepKey] = false
}

function withPending(stepKey: LRStepKey, task: () => Promise<void>) {
  pendingStep.value = stepKey
  localMessage.value = ''
  return task().finally(() => {
    pendingStep.value = null
  })
}

function refreshDerivedDrafts() {
  const nextAugmented = augmentGrammar(grammar.value)
  augmentedDraft.value = buildGrammarDraft(nextAugmented)
  const { dfa, augmentedGrammar: generatedAugmented } = buildCanonicalCollection(grammar.value)
  automatonDraft.value = buildAutomatonDraft(dfa)
  const table =
    mode.value === LRMode.SLR1
      ? buildTable(
          dfa,
          generatedAugmented,
          'SLR1',
          computeFollow(generatedAugmented, computeFirst(generatedAugmented)),
        )
      : buildTable(dfa, generatedAugmented, 'LR0')
  tableDraft.value = table
}

function updateGrammarDraft(value: GrammarDraft) {
  grammarDraft.value = value
  markStaleFrom('grammar-check')
}

function updateAugmentedDraft(value: GrammarDraft) {
  augmentedDraft.value = value
}

function updateStates(value: LRStateDraft[]) {
  automatonDraft.value = { ...automatonDraft.value, states: value }
  markStaleFrom('dfa-isomorphism')
}

function updateTransitions(value: LRTransitionDraft[]) {
  automatonDraft.value = { ...automatonDraft.value, transitions: value }
  markStaleFrom('dfa-isomorphism')
}

function updateTable(value: typeof tableDraft.value) {
  tableDraft.value = value
  markStaleFrom('table-check')
}

function updateTraceInput(value: string) {
  traceState.value = { ...traceState.value, input: value }
}

function updateTraceRows(value: LRTraceDraftRow[]) {
  traceState.value = { ...traceState.value, rows: value }
}

function updateMode(value: LRMode) {
  mode.value = value
  results.value['table-check'] = null
  results.value['trace-match'] = null
  stale.value['table-check'] = true
  stale.value['trace-match'] = true
  refreshDerivedDrafts()
}

async function submitGrammarCheck() {
  await withPending('grammar-check', async () => {
    results.value['grammar-check'] = await lrJudgeService.submitGrammarCheck(
      grammar.value,
      augmentedGrammar.value,
    )
    clearStale('grammar-check')
    if (results.value['grammar-check']?.pass) {
      refreshDerivedDrafts()
    }
  })
}

async function submitDfaCheck() {
  await withPending('dfa-isomorphism', async () => {
    results.value['dfa-isomorphism'] = await lrJudgeService.submitDfaIsomorphism(
      grammar.value,
      automaton.value,
    )
    clearStale('dfa-isomorphism')
  })
}

async function submitTableCheck() {
  await withPending('table-check', async () => {
    results.value['table-check'] = await lrJudgeService.submitTableCheck(
      grammar.value,
      mode.value,
      tableDraft.value,
    )
    clearStale('table-check')
  })
}

async function submitTraceCheck() {
  await withPending('trace-match', async () => {
    results.value['trace-match'] = await lrJudgeService.submitTraceMatch(
      grammar.value,
      mode.value,
      traceState.value.input,
      parseTraceDraftRows(traceState.value.rows),
    )
    clearStale('trace-match')
  })
}
</script>

<template>
  <main class="relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-0 opacity-80 bg-[image:var(--fa-grid-light)] dark:bg-[image:var(--fa-grid-dark)]"
    ></div>

    <section
      class="relative mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:px-6 lg:px-8 lg:py-10 xl:grid-cols-[minmax(0,1.35fr)_24rem]"
    >
      <div class="grid gap-6">
        <div
          class="relative overflow-hidden rounded-[2rem] border border-ctp-surface1/70 bg-ctp-mantle/95 px-6 py-6 text-ctp-text shadow-[0_28px_80px_rgba(30,30,46,0.28)] sm:px-8 sm:py-8"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,194,231,0.22),transparent_32%),radial-gradient(circle_at_80%_14%,rgba(249,226,175,0.2),transparent_28%),linear-gradient(135deg,rgba(49,50,68,0.95),rgba(24,24,37,0.92))]"
          ></div>
          <div class="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div class="space-y-5">
              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-full border border-ctp-surface2 bg-ctp-surface0/80 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-lavender"
                  >Delta Formal Lab</span
                >
                <span
                  class="rounded-full border border-ctp-surface2 bg-ctp-surface0/80 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-peach"
                  >LR Module</span
                >
              </div>
              <div class="space-y-4">
                <p class="font-mono text-xs uppercase tracking-[0.32em] text-ctp-subtext0">
                  Bottom-up Parsing Workbench
                </p>
                <h1
                  class="max-w-4xl font-[family:var(--font-display)] text-4xl leading-tight text-ctp-rosewater sm:text-5xl"
                >
                  Augment the grammar, build the canonical DFA, fill the table, and replay the LR
                  trace.
                </h1>
                <p class="max-w-3xl text-base leading-7 text-ctp-subtext1 sm:text-lg">
                  This is the rough shared shell for both LR(0) and SLR(1). The interaction is
                  intentionally blunt and form-heavy.
                </p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4">
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-yellow">
                  Current mode
                </p>
                <div class="mt-3 flex gap-2">
                  <button
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      mode === LRMode.LR0
                        ? 'bg-ctp-yellow text-ctp-crust'
                        : 'bg-ctp-surface0 text-ctp-text'
                    "
                    @click="updateMode(LRMode.LR0)"
                  >
                    LR(0)
                  </button>
                  <button
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      mode === LRMode.SLR1
                        ? 'bg-ctp-yellow text-ctp-crust'
                        : 'bg-ctp-surface0 text-ctp-text'
                    "
                    @click="updateMode(LRMode.SLR1)"
                  >
                    SLR(1)
                  </button>
                </div>
              </div>
              <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4">
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-green">
                  Start symbol
                </p>
                <p class="mt-3 break-all font-mono text-sm text-ctp-text">
                  {{ grammar.startSymbol || 'unset' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-3 shadow-[0_24px_60px_rgba(136,57,239,0.08)] backdrop-blur dark:bg-ctp-mantle/78"
        >
          <div class="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/60 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-mauve">
                Guided flow
              </p>
              <h2 class="mt-3 font-[family:var(--font-display)] text-2xl text-ctp-text">
                One shell, two LR modes.
              </h2>
              <p class="mt-3 text-sm leading-6 text-ctp-subtext1">
                Step 3 is mode-aware. Step 1, 2, and 4 stay shared between LR(0) and SLR(1).
              </p>
            </div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="step in LR_STEP_META"
                :key="step.key"
                class="rounded-[1.5rem] border px-4 py-4 text-left transition"
                :class="
                  activeStep === step.key
                    ? 'border-ctp-lavender bg-ctp-lavender/12 text-ctp-text shadow-[0_14px_30px_rgba(136,57,239,0.14)]'
                    : 'border-ctp-surface1 bg-ctp-crust/50 text-ctp-subtext1 hover:border-ctp-blue hover:text-ctp-text'
                "
                @click="activeStep = step.key"
              >
                <p class="font-mono text-[11px] uppercase tracking-[0.22em]">{{ step.label }}</p>
                <p class="mt-2 text-sm font-semibold">{{ step.task }}</p>
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="localMessage"
          class="rounded-[1.5rem] border border-ctp-peach/40 bg-ctp-yellow/15 px-5 py-4 text-sm leading-6 text-ctp-text shadow-[0_16px_40px_rgba(254,100,11,0.12)]"
        >
          {{ localMessage }}
        </div>

        <GrammarCheckPanel
          v-if="activeStep === 'grammar-check'"
          :grammar-draft="grammarDraft"
          :augmented-draft="augmentedDraft"
          :pending="pendingStep === 'grammar-check'"
          @update:grammar-draft="updateGrammarDraft"
          @update:augmented-draft="updateAugmentedDraft"
          @submit="submitGrammarCheck"
        />

        <DfaEditorPanel
          v-else-if="activeStep === 'dfa-isomorphism'"
          :states="automatonDraft.states"
          :transitions="automatonDraft.transitions"
          :pending="pendingStep === 'dfa-isomorphism'"
          @update:states="updateStates"
          @update:transitions="updateTransitions"
          @submit="submitDfaCheck"
        />

        <TableEditorPanel
          v-else-if="activeStep === 'table-check'"
          :model-value="tableDraft"
          :pending="pendingStep === 'table-check'"
          @update:model-value="updateTable"
          @submit="submitTableCheck"
        />

        <TraceEditorPanel
          v-else
          :input="traceState.input"
          :rows="traceState.rows"
          :pending="pendingStep === 'trace-match'"
          @update:input="updateTraceInput"
          @update:rows="updateTraceRows"
          @submit="submitTraceCheck"
        />
      </div>

      <div class="grid gap-6">
        <div
          class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82"
        >
          <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-green">
            Module notes
          </p>
          <h2 class="mt-3 font-[family:var(--font-display)] text-3xl text-ctp-text">
            Rough interaction rules
          </h2>
          <div class="mt-5 grid gap-3 text-sm leading-6 text-ctp-subtext1">
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              Grammar fields use CSV for symbol lists and spaces inside productions.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              Item closures are entered one item per line with
              <code class="font-mono text-ctp-text">•</code> marking the dot.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              ACTION cells use <code class="font-mono text-ctp-text">s1</code>,
              <code class="font-mono text-ctp-text">r2</code>, and
              <code class="font-mono text-ctp-text">acc</code>.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              Switching mode only invalidates the table and trace steps.
            </div>
          </div>
        </div>

        <JudgeResultPanel :result="currentResult" />
      </div>
    </section>
  </main>
</template>
