<template>
  <div class="grid gap-y-4 bg-white dark:bg-slate-900 w-lg max-w-full rounded-2xl py-4 px-6 shadow-lg mx-auto">
    <div class="flex flex-wrap gap-4 justify-between">
      <div>
        <p class="font-bold mb-1">Total sold tokens</p>
        <small-tag>
          {{ totalTokensSold || 0 }} {{ environment.lockedToken.id }}
        </small-tag>
      </div>
      <div>
        <p class="font-bold mb-1">
          Min-Max {{ environment.lockedToken.id }} per user
        </p>
        <small-tag>
          {{ environment.minTokenAmount }} - {{ environment.maxTokenAmount }}
          USD
        </small-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SmallTag from './atoms/SmallTag.vue';
import { environment } from '../environment';
import { useStore } from '../store';
import { storeToRefs } from 'pinia';

const store = useStore();
const { totalTokensSold } = storeToRefs(store);
</script>
