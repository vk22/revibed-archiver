<template>
  <div class="global-errors" v-if="globalErrors.length">
    <div class="item" v-for="(error, index) in globalErrors" :key="index">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const globalErrors = computed(() => {
  return store.globalErrors
})

onMounted(() => {})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.global-errors {
  padding: 1rem 1rem 0 1rem;
  color: red;
  font-size: 0.85rem;

  .row {
    margin-bottom: 0rem;
  }
  .col {
    padding: 0;
    margin-bottom: 0.5rem;
  }
  .item {
    margin-bottom: 0.25rem;
  }
}
</style>
@/renderer/store/main
