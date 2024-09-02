<template>
  <div v-if="restoredFilesList.length" class="spectros-container section">
    <v-row>
      <v-col>
        <div class="heading">Spectrograms</div>
        <div v-for="(restoredFile, index) in restoredFilesList" :key="index" class="file-data">
          <div class="file-data__info">
            <div>
              {{ restoredFile.file }}
              <!-- <div>
                {{ restoredFile.rateData.sampleRate }} /
                {{ restoredFile.rateData.bitsPerSample }}
                <span v-if="restoredFile.rateIsOk" class="success"
                  >File is ok</span
                >
                <span v-else class="has-error">Something wrong</span>
              </div>
              <div>
                {{ restoredFile.rateData.duration | minutes }}
              </div> -->
            </div>
          </div>
          <div class="file-data__spectro">
            <img :src="'file://' + restoredFile.spectro" />
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()
const props = defineProps(['rip', 'filesPath'])

const restoredFilesList = computed(() => {
  return store.restoredFilesList
})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.spectros-container {
  margin-top: 2rem;
  padding: 12px;

  .file-data {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #ddd;
    padding-bottom: 1rem;
    margin-bottom: 1rem;

    &__info {
      display: flex;
      justify-content: space-between;
      flex-direction: row;
      margin-bottom: 0.5rem;
    }

    &__spectro {
      img {
        width: 100%;
      }
    }

    // img {
    //   width: 450px;
    // }
  }
}
</style>
@/renderer/store/main
