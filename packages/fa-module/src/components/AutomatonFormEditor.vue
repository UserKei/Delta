<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { EPSILON, type FiniteAutomata } from '@repo/shared-types'
import type { EditableEdge, EditableNode } from '../models'
import {
  buildAutomatonFromGraph,
  nextEdgeId,
  nextNodeId,
  validateEditableAutomaton,
} from '../models'

const props = defineProps<{
  modelValue: FiniteAutomata
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FiniteAutomata]
}>()

const nodes = ref<EditableNode[]>([])
const edges = ref<EditableEdge[]>([])
const selectedNodeId = ref('')
const selectedEdgeId = ref('')
const nodeDraft = ref({ label: '' })
const edgeDraft = ref({ source: '', target: '', label: EPSILON })

const automaton = computed(() =>
  buildAutomatonFromGraph(nodes.value, edges.value, props.modelValue.type),
)
const localError = computed(() => validateEditableAutomaton(automaton.value))

watch(
  () => props.modelValue,
  value => {
    const nextNodes = value.nodes.map(node => ({ ...node }))
    const nextEdges = value.edges.map(edge => ({ ...edge }))
    if (
      JSON.stringify(nextNodes) === JSON.stringify(nodes.value) &&
      JSON.stringify(nextEdges) === JSON.stringify(edges.value)
    ) {
      return
    }

    nodes.value = nextNodes
    edges.value = nextEdges
    selectedNodeId.value = nodes.value[0]?.id ?? ''
    selectedEdgeId.value = edges.value[0]?.id ?? ''
    edgeDraft.value.source = edgeDraft.value.source || nodes.value[0]?.id || ''
    edgeDraft.value.target =
      edgeDraft.value.target || nodes.value[1]?.id || nodes.value[0]?.id || ''
  },
  { deep: true, immediate: true },
)

watch(
  automaton,
  value => {
    if (JSON.stringify(value) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', value)
    }
  },
  { deep: true },
)

const selectedNode = computed(
  () => nodes.value.find(node => node.id === selectedNodeId.value) ?? null,
)
const selectedEdge = computed(
  () => edges.value.find(edge => edge.id === selectedEdgeId.value) ?? null,
)

function addNode() {
  const id = nextNodeId(nodes.value)
  const index = nodes.value.length
  nodes.value = [
    ...nodes.value,
    {
      id,
      label: nodeDraft.value.label.trim() || id,
      isStart: nodes.value.length === 0,
      isEnd: false,
      x: 140 + (index % 3) * 190,
      y: 120 + Math.floor(index / 3) * 170,
    },
  ]
  selectedNodeId.value = id
  edgeDraft.value.source = edgeDraft.value.source || id
  edgeDraft.value.target = edgeDraft.value.target || id
  nodeDraft.value.label = ''
}

function removeSelectedNode() {
  if (!selectedNodeId.value) return
  nodes.value = nodes.value.filter(node => node.id !== selectedNodeId.value)
  edges.value = edges.value.filter(
    edge => edge.source !== selectedNodeId.value && edge.target !== selectedNodeId.value,
  )
  selectedNodeId.value = nodes.value[0]?.id ?? ''
  selectedEdgeId.value = edges.value[0]?.id ?? ''
}

function updateSelectedNode(patch: Partial<EditableNode>) {
  const index = nodes.value.findIndex(node => node.id === selectedNodeId.value)
  const node = nodes.value[index]
  if (index < 0 || !node) return
  nodes.value[index] = { ...node, ...patch }
  nodes.value = [...nodes.value]
}

function updateNodeStart(checked: boolean) {
  const index = nodes.value.findIndex(node => node.id === selectedNodeId.value)
  if (index < 0) return

  if (checked) {
    nodes.value = nodes.value.map((node, currentIndex) => ({
      ...node,
      isStart: currentIndex === index,
    }))
    return
  }

  updateSelectedNode({ isStart: false })
}

function addEdge() {
  if (!edgeDraft.value.source || !edgeDraft.value.target) return

  const id = nextEdgeId(edges.value)
  edges.value = [
    ...edges.value,
    {
      id,
      source: edgeDraft.value.source,
      target: edgeDraft.value.target,
      label: edgeDraft.value.label.trim() || EPSILON,
    },
  ]
  selectedEdgeId.value = id
}

function removeSelectedEdge() {
  if (!selectedEdgeId.value) return
  edges.value = edges.value.filter(edge => edge.id !== selectedEdgeId.value)
  selectedEdgeId.value = edges.value[0]?.id ?? ''
}

function updateSelectedEdge(patch: Partial<EditableEdge>) {
  const index = edges.value.findIndex(edge => edge.id === selectedEdgeId.value)
  const edge = edges.value[index]
  if (index < 0 || !edge) return
  edges.value[index] = { ...edge, ...patch }
  edges.value = [...edges.value]
}
</script>

<template>
  <div class="grid gap-5">
    <div class="rounded-[1.75rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-ctp-text">Nodes</h3>
          <p class="mt-1 text-sm leading-6 text-ctp-subtext1">
            Create states and maintain the single start-state constraint in the form.
          </p>
        </div>
        <button
          class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-3 py-1.5 text-xs font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addNode"
        >
          Add node
        </button>
      </div>

      <div class="mt-4 grid gap-3">
        <input
          v-model="nodeDraft.label"
          type="text"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          placeholder="Optional label override for new node"
        />

        <select
          v-model="selectedNodeId"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
        >
          <option value="">Select node</option>
          <option v-for="node in nodes" :key="node.id" :value="node.id">
            {{ node.id }} · {{ node.label }}
          </option>
        </select>

        <template v-if="selectedNode">
          <input
            :value="selectedNode.label"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            placeholder="Selected node label"
            @input="updateSelectedNode({ label: ($event.target as HTMLInputElement).value })"
          />

          <label class="flex items-center gap-3 text-sm text-ctp-subtext1">
            <input
              :checked="selectedNode.isStart"
              type="checkbox"
              @change="updateNodeStart(($event.target as HTMLInputElement).checked)"
            />
            Start state
          </label>

          <label class="flex items-center gap-3 text-sm text-ctp-subtext1">
            <input
              :checked="selectedNode.isEnd"
              type="checkbox"
              @change="updateSelectedNode({ isEnd: ($event.target as HTMLInputElement).checked })"
            />
            Accepting state
          </label>

          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-4 py-2 text-sm font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeSelectedNode"
          >
            Remove selected node
          </button>
        </template>
      </div>
    </div>

    <div class="rounded-[1.75rem] border border-ctp-surface1 bg-ctp-crust/55 p-5">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-ctp-text">Edges</h3>
          <p class="mt-1 text-sm leading-6 text-ctp-subtext1">
            Manage transitions from the form. Use <code class="font-mono text-ctp-teal">@</code> for
            epsilon.
          </p>
        </div>
        <button
          class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-3 py-1.5 text-xs font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addEdge"
        >
          Add edge
        </button>
      </div>

      <div class="mt-4 grid gap-3">
        <select
          v-model="edgeDraft.source"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
        >
          <option value="">Source</option>
          <option v-for="node in nodes" :key="`source-${node.id}`" :value="node.id">
            {{ node.id }}
          </option>
        </select>
        <select
          v-model="edgeDraft.target"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
        >
          <option value="">Target</option>
          <option v-for="node in nodes" :key="`target-${node.id}`" :value="node.id">
            {{ node.id }}
          </option>
        </select>
        <input
          v-model="edgeDraft.label"
          type="text"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          placeholder="@ for epsilon"
        />

        <select
          v-model="selectedEdgeId"
          class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
        >
          <option value="">Select edge</option>
          <option v-for="edge in edges" :key="edge.id" :value="edge.id">
            {{ edge.id }} · {{ edge.source }} -> {{ edge.target }} · {{ edge.label }}
          </option>
        </select>

        <template v-if="selectedEdge">
          <select
            :value="selectedEdge.source"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @change="updateSelectedEdge({ source: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="node in nodes" :key="`selected-source-${node.id}`" :value="node.id">
              {{ node.id }}
            </option>
          </select>
          <select
            :value="selectedEdge.target"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @change="updateSelectedEdge({ target: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="node in nodes" :key="`selected-target-${node.id}`" :value="node.id">
              {{ node.id }}
            </option>
          </select>
          <input
            :value="selectedEdge.label"
            type="text"
            class="h-11 rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
            @input="
              updateSelectedEdge({ label: ($event.target as HTMLInputElement).value || EPSILON })
            "
          />

          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-4 py-2 text-sm font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeSelectedEdge"
          >
            Remove selected edge
          </button>
        </template>
      </div>
    </div>

    <div
      class="rounded-[1.75rem] border border-ctp-surface1 bg-ctp-mantle p-5 text-sm text-ctp-subtext1 shadow-[0_18px_40px_rgba(30,30,46,0.24)]"
    >
      <div class="flex items-center justify-between gap-4">
        <p class="font-mono text-xs uppercase tracking-[0.22em] text-ctp-yellow">Current export</p>
        <p v-if="localError" class="text-ctp-red">{{ localError }}</p>
      </div>
      <pre
        class="mt-3 overflow-x-auto whitespace-pre-wrap rounded-[1.25rem] bg-ctp-crust p-4 text-xs text-ctp-text"
        >{{ JSON.stringify(automaton, null, 2) }}</pre
      >
    </div>
  </div>
</template>
