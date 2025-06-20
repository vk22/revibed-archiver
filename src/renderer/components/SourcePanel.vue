<template>
  <div class="source-panel" v-if="folderFilesReady">
    <div class="l-col">
      <div class="select-wrap">
        <label>Owners</label>
        <v-select
          :items="ownersList"
          v-model="ownersSelected"
          variant="outlined"
          density="compact"
          @update:modelValue="setSourceDataToStore('owner', ownersSelected)"
        ></v-select>
      </div>
      <div class="select-wrap">
        <label>Media Condition</label>
        <v-select
          :items="conditionsList"
          v-model="conditionsSelected"
          variant="outlined"
          density="compact"
          @update:modelValue="setSourceDataToStore('condition', conditionsSelected)"
        ></v-select>
      </div>
      <div class="select-wrap">
        <label>Rip Quality</label>
        <v-select
          :items="qualityList"
          v-model="qualitySelected"
          variant="outlined"
          density="compact"
          @update:modelValue="setSourceDataToStore('quality', qualitySelected)"
        ></v-select>
      </div>
    </div>
    <div class="r-col"> </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SpectroIcon from './SpectroIcon.vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed, watch } from 'vue'
import { watchEffect } from '@vue/runtime-core'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const folderFilesReady = computed(() => {
  return store.getFolderFilesReadyState
})
const discogsRequest = computed(() => {
  return store.discogsRequest
})
const canSave = computed(() => {
  return store.canSave
})

/// data
const ownersList = computed(() => {
  return store.getReleasesExtraFieldValues('sources')
})
let ownersSelected = ref('')
let conditionsList = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']
let conditionsSelected = ref('')
let qualityList = ['HI', 'LOW']
let qualitySelected = ref('')

function clearAllSelect() {
  ownersSelected.value = ''
  conditionsSelected.value = ''
  qualitySelected.value = ''
}

watchEffect(() => {
  // pretend you have a getData getter in store
  const data = store.getFolderDroppedState
  if (!data) {
    clearAllSelect()
  }
  console.log(data)
})

/// Methods

function setSourceDataToStore(key, value) {
  // console.log('key, value ', key, value)
  store.setSourceData(key, value)
}

onMounted(() => {})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.source-panel {
  top: 0;
  left: 0;
  width: 100%;
  // height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 99;
  background: #fff;
  padding: 1rem;
  border-bottom: 1px solid #ebebeb;
  margin-bottom: 1rem;

  .l-col,
  .r-col {
    display: flex;
    align-items: center;
  }

  .l-col {
    & > div {
      margin-right: 0.5rem;
    }
  }

  .r-col button {
    margin-left: 0.5rem;
  }

  .input-wrap {
    margin-right: 0.5rem !important;
    width: 200px;
  }

  .checkbox-wrap {
    display: flex;
    align-items: center;

    input {
      margin-right: 3px;
    }
  }

  .select-wrap {
    width: 140px;
    // height: 28px;

    .v-input {
      font-size: 0.7rem;
    }
  }
}
</style>
@/renderer/store/main
