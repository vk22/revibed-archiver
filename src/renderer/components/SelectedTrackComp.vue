<template>
  <div class="selected-track" v-if="selectedTrack">
    <div class="input-wrap">
      <div class="has-error" v-if="selectedTrack.errors.length">
        {{ selectedTrack.errors }}
      </div>
    </div>
    <div class="input-wrap">
      <label>Title</label>
      <input type="text" v-model="selectedTrack.metadata.title" />
    </div>
    <div class="input-wrap">
      <label>Artist</label>
      <input type="text" v-model="selectedTrack.metadata.performers" />
    </div>
    <div class="input-wrap">
      <label>Album</label>
      <input type="text" v-model="selectedTrack.metadata.album" />
    </div>
    <div class="input-wrap">
      <label>Genres</label>
      <input type="text" v-model="selectedTrack.metadata.genres" />
    </div>
    <div class="input-wrap">
      <label>Year</label>
      <input type="text" v-model="selectedTrack.metadata.year" />
    </div>
    <div class="mt-5">
      <button class="btn full-w" @click="editTrack()">Edit Track</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const selectedTrack = computed(() => {
  return store.getSelectedTrackItem
})

async function editTrack() {
  store.setTrackID3Tags(selectedTrack.value)
  // const response = await this.$axios.post('http://localhost:8000/api/set-metadata-one-track', {
  //   metadata: selectedTrack.metadata,
  //   filepath: selectedTrack.filepath
  // })
  // console.log('delete response ', response)
}

onMounted(() => {})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.selected-track {
  padding: 1rem;

  .row {
    margin-bottom: 0rem;
  }

  .col {
    padding: 0;
    margin-bottom: 0.5rem;
  }

  .input-wrap {
    margin-bottom: 0.5rem;
  }

  .v-input {
    height: 40px;
  }
}
</style>
@/renderer/store/main
