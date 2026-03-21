<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildLL1Table, computeFirst, computeFollow } from '@repo/core'
import type { LL1JudgeResult } from '@repo/shared-types'
import {
  buildSetDraftFromGrammarSet,
  createEmptyLL1Table,
  createEmptySetDraft,
  createStarterGrammarDraft,
  createStarterTraceDraft,
  LL1_STEP_META,
  parseGrammarDraft,
  parseSetDraft,
  parseTraceDraftRows,
  type GrammarDraft,
  type LL1SetDraft,
  type LL1StepKey,
  type LL1TraceDraftRow,
} from '../models'
import GrammarEditorPanel from '../components/GrammarEditorPanel.vue'
import JudgeResultPanel from '../components/JudgeResultPanel.vue'
import SetEditorPanel from '../components/SetEditorPanel.vue'
import TableEditorPanel from '../components/TableEditorPanel.vue'
import TraceEditorPanel from '../components/TraceEditorPanel.vue'
import { ll1JudgeService } from '../services/service'

const activeStep = ref<LL1StepKey>('grammar-validity')
const grammarDraft = ref<GrammarDraft>(createStarterGrammarDraft())
const grammar = computed(() => parseGrammarDraft(grammarDraft.value))
const firstDraft = ref<LL1SetDraft>(createEmptySetDraft(grammar.value.nonTerminals))
const followDraft = ref<LL1SetDraft>(createEmptySetDraft(grammar.value.nonTerminals))
const tableDraft = ref(createEmptyLL1Table(grammar.value))
const traceState = ref(createStarterTraceDraft())

const results = ref<Record<LL1StepKey, LL1JudgeResult | null>>({
  'grammar-validity': null,
  'set-equality': null,
  'table-cell-match': null,
  'trace-match': null,
})
const stale = ref<Record<LL1StepKey, boolean>>({
  'grammar-validity': false,
  'set-equality': false,
  'table-cell-match': false,
  'trace-match': false,
})
const pendingStep = ref<LL1StepKey | null>(null)
const localMessage = ref('')

const currentStep = computed(() => LL1_STEP_META.find(step => step.key === activeStep.value)!)
const currentResult = computed(() => results.value[activeStep.value])

function markStaleFrom(stepKey: LL1StepKey) {
  const startIndex = LL1_STEP_META.findIndex(step => step.key === stepKey)
  if (startIndex < 0) return

  for (const step of LL1_STEP_META.slice(startIndex + 1)) {
    results.value[step.key] = null
    stale.value[step.key] = true
  }
}

function clearStale(stepKey: LL1StepKey) {
  stale.value[stepKey] = false
}

function withPending(stepKey: LL1StepKey, task: () => Promise<void>) {
  pendingStep.value = stepKey
  localMessage.value = ''
  return task().finally(() => {
    pendingStep.value = null
  })
}

function updateGrammarDraft(value: GrammarDraft) {
  grammarDraft.value = value
  const nextGrammar = parseGrammarDraft(value)
  firstDraft.value = buildSetDraftFromGrammarSet(nextGrammar.nonTerminals)
  followDraft.value = buildSetDraftFromGrammarSet(nextGrammar.nonTerminals)
  tableDraft.value = createEmptyLL1Table(nextGrammar)
  markStaleFrom('grammar-validity')
}

function updateFirstDraft(value: LL1SetDraft) {
  firstDraft.value = value
  markStaleFrom('set-equality')
}

function updateFollowDraft(value: LL1SetDraft) {
  followDraft.value = value
  markStaleFrom('set-equality')
}

function updateTableDraft(value: typeof tableDraft.value) {
  tableDraft.value = value
  markStaleFrom('table-cell-match')
}

function updateTraceInput(value: string) {
  traceState.value = { ...traceState.value, input: value }
}

function updateTraceRows(value: LL1TraceDraftRow[]) {
  traceState.value = { ...traceState.value, rows: value }
}

function autofillFromGrammar() {
  const computedFirst = computeFirst(grammar.value)
  const computedFollow = computeFollow(grammar.value, computedFirst)
  firstDraft.value = buildSetDraftFromGrammarSet(grammar.value.nonTerminals, computedFirst)
  followDraft.value = buildSetDraftFromGrammarSet(grammar.value.nonTerminals, computedFollow)
  try {
    tableDraft.value = buildLL1Table(grammar.value, computedFirst, computedFollow)
  } catch {
    tableDraft.value = createEmptyLL1Table(grammar.value)
  }
}

async function submitGrammar() {
  await withPending('grammar-validity', async () => {
    results.value['grammar-validity'] = await ll1JudgeService.submitGrammarValidity(grammar.value)
    clearStale('grammar-validity')
    if (results.value['grammar-validity']?.pass) {
      autofillFromGrammar()
    }
  })
}

async function submitSets() {
  await withPending('set-equality', async () => {
    results.value['set-equality'] = await ll1JudgeService.submitSetEquality(
      grammar.value,
      parseSetDraft(firstDraft.value, grammar.value.nonTerminals),
      parseSetDraft(followDraft.value, grammar.value.nonTerminals),
    )
    clearStale('set-equality')
  })
}

async function submitTable() {
  await withPending('table-cell-match', async () => {
    results.value['table-cell-match'] = await ll1JudgeService.submitTableCellMatch(
      grammar.value,
      parseSetDraft(firstDraft.value, grammar.value.nonTerminals),
      parseSetDraft(followDraft.value, grammar.value.nonTerminals),
      tableDraft.value,
    )
    clearStale('table-cell-match')
  })
}

async function submitTrace() {
  await withPending('trace-match', async () => {
    results.value['trace-match'] = await ll1JudgeService.submitTraceMatch(
      grammar.value,
      traceState.value.input,
      tableDraft.value,
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
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(180,190,254,0.22),transparent_32%),radial-gradient(circle_at_80%_14%,rgba(166,227,161,0.18),transparent_28%),linear-gradient(135deg,rgba(49,50,68,0.95),rgba(24,24,37,0.92))]"
          ></div>
          <div class="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div class="space-y-5">
              <div class="flex flex-wrap gap-2">
                <span
                  class="rounded-full border border-ctp-surface2 bg-ctp-surface0/80 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-lavender"
                >
                  Delta Formal Lab
                </span>
                <span
                  class="rounded-full border border-ctp-surface2 bg-ctp-surface0/80 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-green"
                >
                  LL(1) Module
                </span>
              </div>
              <div class="space-y-4">
                <p class="font-mono text-xs uppercase tracking-[0.32em] text-ctp-subtext0">
                  Predictive Parsing Workbench
                </p>
                <h1
                  class="max-w-4xl font-[family:var(--font-display)] text-4xl leading-tight text-ctp-rosewater sm:text-5xl"
                >
                  Define the grammar, compute sets, build the table, and simulate the parse.
                </h1>
                <p class="max-w-3xl text-base leading-7 text-ctp-subtext1 sm:text-lg">
                  This is a rough-but-complete LL(1) workflow package with direct form input for
                  every teaching step.
                </p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4">
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-yellow">
                  Active protocol
                </p>
                <p class="mt-3 text-lg font-semibold text-ctp-text">{{ currentStep.task }}</p>
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
                Four rough steps, one module.
              </h2>
              <p class="mt-3 text-sm leading-6 text-ctp-subtext1">
                The module is intentionally blunt: direct forms first, polished pedagogy later.
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="step in LL1_STEP_META"
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

        <GrammarEditorPanel
          v-if="activeStep === 'grammar-validity'"
          :model-value="grammarDraft"
          :pending="pendingStep === 'grammar-validity'"
          @update:model-value="updateGrammarDraft"
          @submit="submitGrammar"
        />

        <SetEditorPanel
          v-else-if="activeStep === 'set-equality'"
          :non-terminals="grammar.nonTerminals"
          :first-draft="firstDraft"
          :follow-draft="followDraft"
          :pending="pendingStep === 'set-equality'"
          @update:first-draft="updateFirstDraft"
          @update:follow-draft="updateFollowDraft"
          @submit="submitSets"
        />

        <TableEditorPanel
          v-else-if="activeStep === 'table-cell-match'"
          :model-value="tableDraft"
          :pending="pendingStep === 'table-cell-match'"
          @update:model-value="updateTableDraft"
          @submit="submitTable"
        />

        <TraceEditorPanel
          v-else
          :input="traceState.input"
          :rows="traceState.rows"
          :pending="pendingStep === 'trace-match'"
          @update:input="updateTraceInput"
          @update:rows="updateTraceRows"
          @submit="submitTrace"
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
              Enter symbols with CSV and production bodies with spaces.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              Sets are judged as unordered equality, so order is ignored.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              The table is checked cell by cell against the standard LL(1) table.
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              Trace rows use stack snapshots, remaining input, and action text.
            </div>
          </div>
        </div>

        <JudgeResultPanel :result="currentResult" />
      </div>
    </section>
  </main>
</template>
