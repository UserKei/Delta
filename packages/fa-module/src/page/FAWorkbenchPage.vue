<script setup lang="ts">
import { computed, ref } from 'vue'
import { AutomatonType, type FAJudgeResult, type FATaskType } from '@repo/shared-types'
import {
  FA_STEP_META,
  buildPartitionGroupsFromDraft,
  buildSubsetAnswerFromDraft,
  createStarterAutomaton,
  createStarterPartitionGroups,
  createStarterSubsetRows,
  syncSubsetDraftAlphabet,
  type FAStepKey,
  type PartitionGroupDraft,
  type SubsetRowDraft,
} from '../models'
import { faJudgeService } from '../services/service'
import { validateEditableAutomaton } from '../models'
import AutomatonWorkbench from '../components/AutomatonWorkbench.vue'
import JudgeResultPanel from '../components/JudgeResultPanel.vue'
import PartitionCheckPanel from '../components/PartitionCheckPanel.vue'
import RegexEquivalencePanel from '../components/RegexEquivalencePanel.vue'
import SubsetMatrixPanel from '../components/SubsetMatrixPanel.vue'

const activeStep = ref<FAStepKey>('string-equivalence')
const targetRegex = ref('(a|b)*.a')
const answerRegex = ref('((a|b)*).a')
const nfaAnswer = ref(createStarterAutomaton(AutomatonType.NFA))
const subsetRows = ref<SubsetRowDraft[]>(createStarterSubsetRows(nfaAnswer.value.alphabet))
const dfaAnswer = ref(createStarterAutomaton(AutomatonType.DFA))
const partitionGroups = ref<PartitionGroupDraft[]>(createStarterPartitionGroups())
const minDfaAnswer = ref(createStarterAutomaton(AutomatonType.MIN_DFA))

const results = ref<Record<FAStepKey, FAJudgeResult | null>>({
  'string-equivalence': null,
  'graph-structure': null,
  'matrix-content': null,
  'graph-isomorphism': null,
  'partition-check': null,
  'canonical-isomorphism': null,
})

const stale = ref<Record<FAStepKey, boolean>>({
  'string-equivalence': false,
  'graph-structure': false,
  'matrix-content': false,
  'graph-isomorphism': false,
  'partition-check': false,
  'canonical-isomorphism': false,
})

const pendingStep = ref<FAStepKey | null>(null)
const localMessage = ref('')

const currentStep = computed(() => FA_STEP_META.find(step => step.key === activeStep.value)!)
const currentStepIndex = computed(
  () => FA_STEP_META.findIndex(step => step.key === activeStep.value) + 1,
)
const progressLabel = computed(() => `${currentStepIndex.value} / ${FA_STEP_META.length}`)
const currentResult = computed(() => results.value[activeStep.value])

function markStaleFrom(stepKey: FAStepKey) {
  const startIndex = FA_STEP_META.findIndex(step => step.key === stepKey)
  if (startIndex < 0) return

  for (const step of FA_STEP_META.slice(startIndex + 1)) {
    results.value[step.key] = null
    stale.value[step.key] = true
  }
}

function clearStale(stepKey: FAStepKey) {
  stale.value[stepKey] = false
}

function withPending(stepKey: FAStepKey, task: () => Promise<void>) {
  pendingStep.value = stepKey
  localMessage.value = ''
  return task().finally(() => {
    pendingStep.value = null
  })
}

function updateTargetRegex(value: string) {
  targetRegex.value = value
  markStaleFrom('string-equivalence')
}

function updateAnswerRegex(value: string) {
  answerRegex.value = value
}

function updateNfa(value: typeof nfaAnswer.value) {
  nfaAnswer.value = value
  subsetRows.value = syncSubsetDraftAlphabet(subsetRows.value, value.alphabet)
  markStaleFrom('graph-structure')
}

function updateSubsetRows(value: SubsetRowDraft[]) {
  subsetRows.value = syncSubsetDraftAlphabet(value, nfaAnswer.value.alphabet)
  markStaleFrom('matrix-content')
}

function updateDfa(value: typeof dfaAnswer.value) {
  dfaAnswer.value = value
  markStaleFrom('graph-isomorphism')
}

function updatePartitionGroups(value: PartitionGroupDraft[]) {
  partitionGroups.value = value
  markStaleFrom('partition-check')
}

function updateMinDfa(value: typeof minDfaAnswer.value) {
  minDfaAnswer.value = value
}

async function submitStringEquivalence() {
  if (!targetRegex.value.trim() || !answerRegex.value.trim()) {
    localMessage.value = 'Both target and submitted regex are required.'
    return
  }

  await withPending('string-equivalence', async () => {
    results.value['string-equivalence'] = await faJudgeService.submitStringEquivalence(
      targetRegex.value.trim(),
      answerRegex.value.trim(),
    )
    clearStale('string-equivalence')
  })
}

async function submitGraphStructure() {
  const validation = validateEditableAutomaton(nfaAnswer.value)
  if (validation) {
    localMessage.value = validation
    return
  }

  await withPending('graph-structure', async () => {
    results.value['graph-structure'] = await faJudgeService.submitGraphStructure(
      targetRegex.value.trim(),
      nfaAnswer.value,
    )
    clearStale('graph-structure')
  })
}

async function submitSubsetMatrix() {
  await withPending('matrix-content', async () => {
    results.value['matrix-content'] = await faJudgeService.submitSubsetMatrix(
      targetRegex.value.trim(),
      buildSubsetAnswerFromDraft(nfaAnswer.value, subsetRows.value, nfaAnswer.value.alphabet),
    )
    clearStale('matrix-content')
  })
}

async function submitDfaGraph() {
  const validation = validateEditableAutomaton(dfaAnswer.value)
  if (validation) {
    localMessage.value = validation
    return
  }

  await withPending('graph-isomorphism', async () => {
    results.value['graph-isomorphism'] = await faJudgeService.submitDfaIsomorphism(
      targetRegex.value.trim(),
      dfaAnswer.value,
    )
    clearStale('graph-isomorphism')
  })
}

async function submitPartitionCheck() {
  await withPending('partition-check', async () => {
    results.value['partition-check'] = await faJudgeService.submitPartitionCheck(
      targetRegex.value.trim(),
      {
        dfa: dfaAnswer.value,
        partitions: buildPartitionGroupsFromDraft(partitionGroups.value),
      },
    )
    clearStale('partition-check')
  })
}

async function submitCanonicalMinDfa() {
  const validation = validateEditableAutomaton(minDfaAnswer.value)
  if (validation) {
    localMessage.value = validation
    return
  }

  await withPending('canonical-isomorphism', async () => {
    results.value['canonical-isomorphism'] = await faJudgeService.submitCanonicalMinDfa(
      targetRegex.value.trim(),
      minDfaAnswer.value,
    )
    clearStale('canonical-isomorphism')
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
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(203,166,247,0.24),transparent_32%),radial-gradient(circle_at_80%_14%,rgba(137,180,250,0.22),transparent_28%),linear-gradient(135deg,rgba(49,50,68,0.95),rgba(24,24,37,0.92))]"
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
                  class="rounded-full border border-ctp-surface2 bg-ctp-surface0/80 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.26em] text-ctp-teal"
                >
                  Step {{ progressLabel }}
                </span>
              </div>

              <div class="space-y-4">
                <p class="font-mono text-xs uppercase tracking-[0.32em] text-ctp-subtext0">
                  Finite Automata Workbench
                </p>
                <h1
                  class="max-w-4xl font-[family:var(--font-display)] text-4xl leading-tight text-ctp-rosewater sm:text-5xl"
                >
                  Complete FA workflow from regex equivalence to canonical minimal DFA.
                </h1>
                <p class="max-w-3xl text-base leading-7 text-ctp-subtext1 sm:text-lg">
                  This module keeps every FA step inside one domain package so future agents can
                  reason about the workflow without mixing web-shell concerns.
                </p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
              <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4">
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-yellow">
                  Active protocol
                </p>
                <p class="mt-3 text-lg font-semibold text-ctp-text">{{ currentStep.task }}</p>
              </div>
              <div class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4">
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-green">
                  Target regex
                </p>
                <p class="mt-3 break-all font-mono text-sm text-ctp-text">{{ targetRegex }}</p>
              </div>
              <div
                class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/70 p-4 sm:col-span-3 xl:col-span-2"
              >
                <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-pink">
                  Current focus
                </p>
                <p class="mt-3 text-sm leading-6 text-ctp-subtext1">
                  {{ currentStep.description }}
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
                Step through the entire FA pipeline.
              </h2>
              <p class="mt-3 text-sm leading-6 text-ctp-subtext1">
                Each later step depends on the current draft of the previous one. Editing earlier
                work invalidates downstream results so the flow stays honest.
              </p>
            </div>

            <div class="grid gap-4">
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <button
                  v-for="step in FA_STEP_META"
                  :key="step.key"
                  class="group rounded-[1.5rem] border px-4 py-4 text-left transition duration-200"
                  :class="
                    activeStep === step.key
                      ? 'border-ctp-lavender bg-ctp-lavender/12 text-ctp-text shadow-[0_14px_30px_rgba(136,57,239,0.14)]'
                      : 'border-ctp-surface1 bg-ctp-crust/50 text-ctp-subtext1 hover:border-ctp-blue hover:text-ctp-text'
                  "
                  @click="activeStep = step.key"
                >
                  <span
                    class="block font-mono text-[11px] uppercase tracking-[0.22em] opacity-80"
                    >{{ step.label }}</span
                  >
                  <span class="mt-2 block text-sm font-semibold">{{ step.task }}</span>
                  <span class="mt-2 block text-xs leading-5 opacity-85">
                    {{
                      stale[step.key]
                        ? 'Needs review'
                        : results[step.key]
                          ? results[step.key]?.pass
                            ? 'Passed'
                            : 'Failed'
                          : 'Pending'
                    }}
                  </span>
                </button>
              </div>

              <div class="rounded-[1.75rem] border border-ctp-surface1 bg-ctp-crust/50 p-5">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-sapphire">
                      Live brief
                    </p>
                    <h3 class="mt-2 text-xl font-semibold text-ctp-text">{{ currentStep.task }}</h3>
                  </div>
                  <div
                    class="rounded-full border border-ctp-surface1 bg-ctp-base/60 px-4 py-2 text-sm text-ctp-subtext1 dark:bg-ctp-mantle/80"
                  >
                    Shared target:
                    <span class="font-mono text-ctp-text">{{ targetRegex }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p
          v-if="localMessage"
          class="rounded-[1.5rem] border border-ctp-peach/40 bg-ctp-yellow/15 px-5 py-4 text-sm leading-6 text-ctp-text shadow-[0_16px_40px_rgba(254,100,11,0.12)]"
        >
          {{ localMessage }}
        </p>

        <RegexEquivalencePanel
          v-if="activeStep === 'string-equivalence'"
          :target-regex="targetRegex"
          :answer-regex="answerRegex"
          :pending="pendingStep === 'string-equivalence'"
          @update:target-regex="updateTargetRegex"
          @update:answer-regex="updateAnswerRegex"
          @submit="submitStringEquivalence"
        />

        <AutomatonWorkbench
          v-else-if="activeStep === 'graph-structure'"
          step-label="Step 2"
          title="Thompson NFA form editor"
          description="Edit nodes and transitions in the form for"
          note="Build the exact Thompson structure. The frontend checks for a single start state, complete edge references, and uses @ as the epsilon token before the judge compares graph isomorphism."
          :model-value="nfaAnswer"
          :target-regex="targetRegex"
          :pending="pendingStep === 'graph-structure'"
          action-label="Validate Graph"
          preview-title="Current Thompson NFA preview"
          @update:model-value="updateNfa"
          @submit="submitGraphStructure"
        />

        <SubsetMatrixPanel
          v-else-if="activeStep === 'matrix-content'"
          :target-regex="targetRegex"
          :alphabet="nfaAnswer.alphabet"
          :rows="subsetRows"
          :pending="pendingStep === 'matrix-content'"
          @update:rows="updateSubsetRows"
          @submit="submitSubsetMatrix"
        />

        <AutomatonWorkbench
          v-else-if="activeStep === 'graph-isomorphism'"
          step-label="Step 4"
          title="DFA graph workbench"
          description="Construct the DFA implied by the subset table for"
          note="This graph should match the subset-construction result from Step 3. Keep labels and accepting states consistent with your table rows."
          :model-value="dfaAnswer"
          :target-regex="targetRegex"
          :pending="pendingStep === 'graph-isomorphism'"
          action-label="Validate DFA"
          preview-title="Current DFA preview"
          @update:model-value="updateDfa"
          @submit="submitDfaGraph"
        />

        <PartitionCheckPanel
          v-else-if="activeStep === 'partition-check'"
          :dfa="dfaAnswer"
          :groups="partitionGroups"
          :pending="pendingStep === 'partition-check'"
          @update:groups="updatePartitionGroups"
          @submit="submitPartitionCheck"
        />

        <AutomatonWorkbench
          v-else
          step-label="Step 6"
          title="Minimal DFA workbench"
          description="Construct the canonical minimal DFA for"
          note="Use the minimized partitioning from Step 5. The final graph must be language-equivalent and canonical up to isomorphism."
          :model-value="minDfaAnswer"
          :target-regex="targetRegex"
          :pending="pendingStep === 'canonical-isomorphism'"
          action-label="Validate Minimal DFA"
          preview-title="Current minimal DFA preview"
          @update:model-value="updateMinDfa"
          @submit="submitCanonicalMinDfa"
        />
      </div>

      <aside class="grid gap-6 self-start">
        <div
          class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82"
        >
          <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-green">
            Module notes
          </p>
          <h2 class="mt-3 font-[family:var(--font-display)] text-3xl text-ctp-text">
            What the learner must respect
          </h2>
          <div class="mt-5 grid gap-3 text-sm leading-6 text-ctp-subtext1">
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              <p class="font-semibold text-ctp-text">Step 1</p>
              <p class="mt-1">
                Use explicit concatenation with <code class="font-mono text-ctp-mauve">.</code>.
              </p>
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              <p class="font-semibold text-ctp-text">Step 2</p>
              <p class="mt-1">
                Exactly one start state, and <code class="font-mono text-ctp-teal">@</code> denotes
                epsilon.
              </p>
            </div>
            <div class="rounded-[1.25rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4">
              <p class="font-semibold text-ctp-text">Step 3-6</p>
              <p class="mt-1">
                Editing an earlier draft invalidates later results so the pipeline remains
                consistent.
              </p>
            </div>
          </div>
        </div>

        <JudgeResultPanel :result="currentResult" />
      </aside>
    </section>
  </main>
</template>
