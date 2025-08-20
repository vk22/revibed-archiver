<template>
  <div class="filter-by-styles" v-if="allStyles.length">
    <!-- <div class="selected-tag" v-if="selectedTag">
          {{ selectedTag }}
        </div> -->
    <!-- <div class="clear-tags" @click="resetTags()">
          <v-icon small v-if="selectedTag">mdi-filter-remove</v-icon>
        </div> -->
    <div class="tags">
      <div
        class="tag"
        v-for="(tag, index) in allStyles"
        :key="index"
        @click="selectTag(tag.name)"
        :class="{
          selected: selectedTag === tag.name,
          disable: selectedTag !== undefined && selectedTag !== tag.name
        }"
      >
        {{ tag.name }} {{ tag.count }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()
const allStyles = computed(() => {
  return store.getAllStyles
})

// const allStyles = [
//   'House',
//   'Funk',
//   'Disco',
//   'Synth-pop',
//   'Boogie',
//   'Soul',
//   'Deep House',
//   'Progressive House',
//   'Electro',
//   'Techno',
//   'Downtempo',
//   'Italo-Disco'
// ]

let selectedTag = ref(undefined)

function selectTag(tag) {
  if (selectedTag.value !== tag) {
    selectedTag.value = tag
  } else {
    selectedTag.value = undefined
  }

  /// store
  setTimeout(() => {
    store.setSelectedStyleInFilter(selectedTag.value)
  }, 100)
}
function resetTags() {
  selectedTag.value = undefined
}
</script>

<style lang="scss" scoped>
@import '@/renderer/assets/scss/main.scss';

.filter-by-styles {
  background: #fff;
  padding: 1rem;

  .selected-tag {
    display: inline-block;
    font-size: 0.85rem;
    background: #333;
    color: #fff;
    padding: 0.35rem 0.5rem 0.35rem;
    border-radius: 4px;
    margin-right: 0.25rem;
    margin-bottom: 0.25rem;
    line-height: 1;
  }

  .clear-tags {
    margin: 10px 0;
    display: inline-block;
    cursor: pointer;
    height: 30px;
    // color: #444
  }

  .tags {
    display: flex;
    flex-wrap: wrap;

    .tag {
      font-size: 0.85rem;
      background: #fff;
      border: 1px solid #e8e8e8;
      color: #333;
      padding: 0.5rem 0.5rem;
      border-radius: 6px;
      margin-right: 0.25rem;
      margin-bottom: 0.25rem;
      line-height: 1;
      cursor: pointer;

      &.disable {
        opacity: 0.95;
      }

      &.selected {
        background: #333;
        color: #fff;
      }
    }
  }
}
</style>
@/renderer/store/main
