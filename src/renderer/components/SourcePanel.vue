<template>
  <div class="source-panel" v-if="folderFilesReady">
    <div class="l-col">
      <div class="select-wrap">
        <label>Owners</label>
        <v-select :items="ownersList" v-model="ownersSelected" variant="outlined" density="compact"
          @update:modelValue="setSourceDataToStore('owner', ownersSelected)"></v-select>
      </div>
      <div class="select-wrap">
        <label>Media Condition</label>
        <v-select :items="conditionsList" v-model="conditionsSelected" variant="outlined" density="compact"
          @update:modelValue="setSourceDataToStore('condition', conditionsSelected)"></v-select>
      </div>
      <div class="select-wrap">
        <label>Rip Quality</label>
        <v-select :items="qualityList" v-model="qualitySelected" variant="outlined" density="compact"
          @update:modelValue="setSourceDataToStore('quality', qualitySelected)"></v-select>
      </div>
    </div>
    <div class="r-col">
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SpectroIcon from './SpectroIcon.vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
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
let isRework = ref(null)
let discogsLinkTemp = ref(undefined)
let matchType = true
let ownersList = ['Anton', 'Revibed', 'KX Balance', 'KX']
let ownersSelected = ref(null)
let conditionsList = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']
let conditionsSelected = ref(null)
let qualityList = ['HI', 'LOW']
let qualitySelected = ref(null)

// const ownersSelected = computed(() => {
//   return store.sourceData
// })

/// Methods

function setSourceDataToStore(key, value) {
  // console.log('key, value ', key, value)
  store.setSourceData(key, value)
}
function parseDiscogsLink() {
  const arr = discogsLinkTemp.value.split('/')
  const releaseIndex = arr.indexOf('release')
  if (releaseIndex < 0) {
    console.log('Incorrect link')
    alert('Incorrect link')
  } else {
    const idIndex = releaseIndex + 1
    const id = arr[idIndex].split('-')[0]
    return id
  }
}
async function parseDiscogs() {
  store.setLoading({ state: true })
  if (!discogsLinkTemp.value) return
  const releaseID = parseDiscogsLink()
  if (!releaseID) return
  /// Проверка на лейбл
  const checkReleaseBefore = await store.checkRelease(releaseID)
  console.log('checkReleaseBefore ', checkReleaseBefore)
  let checkReleaseBeforeHandledArr = Object.values(checkReleaseBefore.data.data)
  let checkReleaseBeforeHandled = checkReleaseBeforeHandledArr.some(item => item === 'warning' || item === 'blocked')
  if (checkReleaseBeforeHandled) {
    alert(JSON.stringify('Dangerous label!'))
  }
  /// Проверка на релиз
  const checkRelease = store.getIfprojectExists(releaseID)
  console.log('checkRelease ', checkRelease)
  console.log('isRework ', isRework.value)
  if (checkRelease.exist) {
    // release exit
    if (checkRelease.type === 'preorder' || checkRelease.type === 'allowed_to_buy') {
      alert('This is ' + checkRelease.type)
    } else {
      if (!isRework.value) {
        alert('This release already has been done!')
        store.setLoading({ state: false })
        return
      }
    }
  }
  // if (checkRelease && !isRework.value) {
  //   alert('This release already has been done!')
  //   store.setLoading({ state: false })
  //   return
  // }
  ///
  store.parseDiscogs(releaseID)
}
function checkFiles() {
  store.checkFiles()
}
function saveDiscogsTags() {
  store.setDiscogsTags()
}
function clearState() {
  discogsLinkTemp.value = undefined
  // store.clearState()
  store.$reset()
}
function archiveProject() {
  store.archiveProject({ source: this.sourceSelected })
}
function setMatchType(event) {
  console.log('setMatchType ', event.target.checked)
  let type = event.target.checked ? 'match-by-position' : 'match-by-title'
  store.setMatchType(type)
}
function setDiscogsSubtracksStage(event) {
  console.log('setDiscogsSubtracksStage ', event.target.checked)
  let type = event.target.checked
  store.setDiscogsSubtracksStage(type)
}

onMounted(() => { })
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
    &>div {
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
