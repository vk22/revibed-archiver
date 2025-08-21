<template>
  <v-container fluid class="pa-0">
    <Favorites></Favorites>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import Favorites from '@/renderer/components/Favorites.vue'
import { onMounted, computed, watch } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()



onMounted(() => { })
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.loading-screen-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 95vh;
}

.releases-list {
  padding-bottom: 4rem;
}

.releases-filters-tool {
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}

.search-container {
  padding: 1rem;
}

table thead {
  // background: $color_black;
  color: #777;
  font-weight: 700;
}

.stats-block {
  text-align: right;
  width: 100%;
  display: flex;
  justify-content: flex-end;

  div {
    margin-left: 1.5rem;
  }

  b {
    width: 38px;
    display: inline-block;
  }
}

.grey {
  color: #c1c1c1;
}

.cover-img {
  width: 50px;
  border-radius: 8px;
  overflow: hidden;
  display: block;
  padding: 4px;
}
</style>
