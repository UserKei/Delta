<script setup lang="ts">
import type { FiniteAutomata } from '@repo/shared-types'
import type { PartitionGroupDraft } from '../models'
import { nextPartitionGroupId } from '../models'

const props = defineProps<{
  dfa: FiniteAutomata
  groups: PartitionGroupDraft[]
  pending?: boolean
}>()

const emit = defineEmits<{
  'update:groups': [value: PartitionGroupDraft[]]
  submit: []
}>()

function addGroup() {
  emit('update:groups', [
    ...props.groups,
    {
      id: nextPartitionGroupId(props.groups),
      stateInput: '',
    },
  ])
}

function updateGroup(id: string, stateInput: string) {
  emit(
    'update:groups',
    props.groups.map(group => (group.id === id ? { ...group, stateInput } : group)),
  )
}

function removeGroup(id: string) {
  emit(
    'update:groups',
    props.groups.filter(group => group.id !== id),
  )
}
</script>

<template>
  <section
    class="rounded-[2rem] border border-ctp-surface1 bg-ctp-base/85 p-6 shadow-[0_24px_60px_rgba(136,57,239,0.08)] dark:bg-ctp-mantle/82 sm:p-7"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ctp-pink">Step 5</p>
        <h2 class="mt-2 font-[family:var(--font-display)] text-3xl text-ctp-text">
          Partition refinement
        </h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-ctp-subtext1">
          Group DFA state ids into equivalent classes. Each state must appear exactly once across
          all partitions.
        </p>
      </div>
      <div class="flex gap-3">
        <button
          class="rounded-full border border-ctp-surface1 bg-ctp-base/70 px-4 py-2 text-sm font-semibold text-ctp-text transition hover:border-ctp-blue hover:text-ctp-blue dark:bg-ctp-mantle/80"
          @click="addGroup"
        >
          Add group
        </button>
        <button
          class="rounded-full bg-ctp-pink px-5 py-2.5 text-sm font-semibold text-ctp-crust transition hover:bg-ctp-mauve disabled:cursor-not-allowed disabled:bg-ctp-surface1 disabled:text-ctp-subtext0"
          :disabled="pending"
          @click="emit('submit')"
        >
          {{ pending ? 'Checking...' : 'Validate Partition' }}
        </button>
      </div>
    </div>

    <div
      class="mt-5 rounded-[1.5rem] border border-ctp-surface1 bg-ctp-surface0/45 p-4 text-sm leading-6 text-ctp-subtext1"
    >
      Current DFA state ids:
      <span class="font-mono text-ctp-text">{{
        dfa.nodes.map(node => node.id).join(', ') || 'none'
      }}</span>
    </div>

    <div class="mt-6 grid gap-4">
      <div
        v-for="group in groups"
        :key="group.id"
        class="rounded-[1.5rem] border border-ctp-surface1 bg-ctp-crust/55 p-5"
      >
        <div class="flex items-center justify-between gap-4">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ctp-pink">
            {{ group.id }}
          </p>
          <button
            class="rounded-full border border-ctp-red/35 bg-ctp-red/14 px-3 py-1 text-xs font-semibold text-ctp-red transition hover:bg-ctp-red/20"
            @click="removeGroup(group.id)"
          >
            Remove
          </button>
        </div>

        <input
          :value="group.stateInput"
          type="text"
          class="mt-4 h-11 w-full rounded-2xl border border-ctp-surface1 bg-ctp-base/70 px-4 font-mono text-sm text-ctp-text focus:border-ctp-lavender focus:ring-2 focus:ring-ctp-lavender/20 dark:bg-ctp-mantle/80"
          placeholder="0,1"
          @input="updateGroup(group.id, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </section>
</template>
