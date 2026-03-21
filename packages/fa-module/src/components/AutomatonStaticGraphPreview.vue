<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import { EPSILON, type FiniteAutomata } from '@repo/shared-types'

const props = defineProps<{
  automaton: FiniteAutomata
  title?: string
  emptyMessage?: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const graph = ref<Core | null>(null)

onMounted(() => {
  renderGraph()
})

onBeforeUnmount(() => {
  graph.value?.destroy()
})

watch(
  () => props.automaton,
  () => {
    renderGraph()
  },
  { deep: true },
)

function buildElements(): ElementDefinition[] {
  return [
    ...props.automaton.nodes.map((node, index) => ({
      data: {
        id: node.id,
        label: `${node.label}${node.isStart ? ' [start]' : ''}${node.isEnd ? ' [end]' : ''}`,
      },
      position: {
        x: node.x ?? 140 + (index % 3) * 190,
        y: node.y ?? 120 + Math.floor(index / 3) * 170,
      },
    })),
    ...props.automaton.edges.map(edge => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label || EPSILON,
      },
    })),
  ]
}

function renderGraph() {
  if (!containerRef.value) return

  const elements = buildElements()
  if (!graph.value) {
    graph.value = cytoscape({
      container: containerRef.value,
      elements,
      layout: { name: 'preset', fit: true, padding: 40 },
      minZoom: 0.4,
      maxZoom: 2,
      autoungrabify: true,
      autounselectify: false,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0f172a',
            color: '#f8fafc',
            label: 'data(label)',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 11,
            width: 74,
            height: 74,
            'border-width': 2,
            'border-color': '#e2e8f0',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': '#0f766e',
            'target-arrow-color': '#0f766e',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 11,
            color: '#0f172a',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
          },
        },
      ],
    })
    return
  }

  graph.value.elements().remove()
  graph.value.add(elements)
  graph.value.layout({ name: 'preset', fit: true, padding: 40 }).run()
}
</script>

<template>
  <div class="rounded-[1.75rem] border border-ctp-surface1 bg-ctp-crust/55 p-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-sapphire">Preview</p>
        <h3 class="mt-1 font-[family:var(--font-display)] text-2xl text-ctp-text">
          {{ title ?? 'Static graph preview' }}
        </h3>
      </div>
      <div
        class="rounded-full border border-ctp-surface1 bg-ctp-base/65 px-3 py-1 text-xs font-medium text-ctp-subtext1 dark:bg-ctp-mantle/80"
      >
        Read only
      </div>
    </div>

    <div
      v-if="automaton.nodes.length === 0"
      class="mt-4 flex h-[620px] items-center justify-center rounded-[1.5rem] border border-dashed border-ctp-surface1 bg-ctp-base/65 px-6 text-center text-sm leading-6 text-ctp-subtext1 dark:bg-ctp-mantle/80"
    >
      {{ emptyMessage ?? 'Add nodes and edges in the form to preview the graph.' }}
    </div>
    <div
      v-else
      ref="containerRef"
      class="mt-4 h-[620px] rounded-[1.5rem] border border-ctp-surface1 bg-ctp-base/65 dark:bg-ctp-mantle/80"
    ></div>

    <div class="mt-4 flex items-center justify-between text-sm text-ctp-subtext1">
      <span>Use the form to change structure, labels, and accepting states.</span>
      <span
        class="rounded-full border border-ctp-surface1 bg-ctp-base/60 px-3 py-1 font-mono text-xs text-ctp-text dark:bg-ctp-mantle/80"
      >
        {{ automaton.nodes.length }} nodes · {{ automaton.edges.length }} edges
      </span>
    </div>
  </div>
</template>
