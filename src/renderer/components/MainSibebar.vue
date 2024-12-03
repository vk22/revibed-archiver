<template>
  <!-- sidebar -->
  <v-navigation-drawer v-model="sideNav" permanent app class="sidebar">
    <div class="pa-3 main-logo">
      <div class="main-logo__wrap">
        <div class="logo">
          <img src="../assets/img/RV-logo.svg" />
        </div>
      </div>
    </div>

    <div v-if="folderDropped">
      <div v-if="folderFiles.visual.length" class="folder-files pa-3 section">
        <div class="heading">Visual</div>
        <div class="images-container">
          <div v-for="(visual, i) in folderFiles.visual" :key="i" class="image-item">
            <img
              :src="'file://' + visual.filepath"
              :class="{ main: visual.filename === selectedVisual.filename }"
              @click="selectImage(visual)"
            />
            <div class="checkbox-on-image">
              <input
                id="mainImage"
                type="checkbox"
                :checked="mainImage.filename === visual.filename"
                @change="setMainImage(visual, $event)"
              />
              <!-- <label for="mainImage">Main</label> -->
            </div>
          </div>
        </div>
      </div>
      <div v-else class="folder-files pa-3">
        <div class="folder-files__title">Visual</div>
        <div class="no-items">No Images</div>
      </div>
      <div v-if="selectedVisual.filename" class="selected-image">
        <div class="input-wrap">
          <label>Filename</label>
          <div>{{ selectedVisual.filename }}</div>
        </div>
        <div class="input-wrap mt-2">
          <label>Size</label>
          <div>{{ selectedVisual.imageSize }}</div>
        </div>
        <div class="select-wrap">
          <label>New Filename</label>
          <v-select
            v-model="newFilenameSelected"
            :items="coversNamesList"
            variant="outlined"
            density="compact"
            @change="changeFilenameDone()"
            placeholder="Choose filename"
          ></v-select>
        </div>

        <div class="mt-5 d-flex">
          <button
            class="btn main mr-1"
            @click="editImage()"
            :class="{ disable: !newFilenameSelected }"
            >Save</button
          >
          <button class="btn error" @click="deleteFile()">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="folderDropped">
      <GlobalErrors />
      <SelectedTrackComp />
    </div>

    <div class="sibebar-footer">
      <!-- <button class="btn sm-btn" @click="$store.dispatch('createCovers')">Covers generator</button> -->
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import SelectedTrackComp from '@/renderer/components/SelectedTrackComp.vue'
import GlobalErrors from '@/renderer/components/GlobalErrors.vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const folderPath = computed(() => {
  return store.getFolderPath
})
const folderFilesReady = computed(() => {
  return store.getFolderFilesReadyState
})
const folderDropped = computed(() => {
  return store.getFolderDroppedState
})
const folderFiles = computed(() => {
  return store.getFolderDroppedData
})
const allDataInStore = computed(() => {
  return store.allDataInStore
})
const selectedTrack = computed(() => {
  return store.selectedTrack
})
const selectedVisual = computed(() => {
  return store.selectedVisual
})
const mainImage = computed(() => {
  return store.mainImage
})

/// data
let sideNav = ref(true)
let responseMessage = ref(undefined)
let searchQuery = ref('')
let isInputFunctionRunning = ref(false)
let coversNamesList = [
  'Front',
  'Back',
  'A',
  'B',
  'C',
  'D',
  'Disc',
  'Inner',
  'Inner1',
  'Inner2',
  'Inner3',
  'Inner4',
  'Cover'
]
let newFilenameSelected = ref(undefined)
let selectedVisualDefault = ref({
  filename: undefined,
  filepath: undefined
})

/// Methods

const selectImage = (visual) => {
  store.setSelectedVisual(visual)
}
const setMainImage = (visual) => {
  store.setMainImage(visual)
}
const changeFilenameDone = (data) => {
  console.log('changeFilenameDone ', selectedVisual.value)
  store.editImage({
    oldPath: selectedVisual.value.filename,
    newPath: data,
    imageSize: selectedVisual.value.imageSize
  })
  newFilenameSelected.value = undefined
}
const deleteFile = () => {
  store.deleteFile(selectedVisual.value.filename)
}
watch(newFilenameSelected, (newValue) => {
  console.log('newValue ', newValue)
  if (!newValue) return
  changeFilenameDone(newValue)
})

onMounted(() => {})
</script>

<style lang="scss" scoped>
@import '@/renderer/assets/scss/main.scss';

.sidebar {
  background: #fff !important;
  z-index: 9;

  .main-logo {
    width: 100%;
    height: 50px;
    top: 0px;
    position: sticky;
    left: 0;
    background: #171717;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 1rem;
    margin-bottom: 0.75rem;
    z-index: 99;

    &__wrap {
      line-height: 0.8;

      .logo {
        cursor: pointer;
        display: flex;
        color: #333;
        font-weight: 600;
        align-items: center;

        // font-size: 0.75rem;
        img {
          margin-right: 15px;
          width: 160px;
        }
      }
    }
  }

  .folder-path {
    border-bottom: 1px solid #ddd;
  }

  .folder-files {
    border-bottom: 1px solid #ddd;
    padding-left: 1rem;

    &__title {
    }

    &__item {
      display: flex;
      align-items: center;
      padding: 0.15rem 0;
    }

    .images-container {
      position: relative;
      width: 100%;
      display: flex;
      flex-wrap: wrap;

      .image-item {
        position: relative;
        flex-basis: 50%;
        width: 50%;
      }

      .checkbox-on-image {
        position: absolute;
        top: 6px;
        left: 6px;
        z-index: 9;
        background: #fff;
        color: #171717;
        padding: 2px;
        border: 1px solid #ddd;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        // width: 30px;
        // height: 30px;
      }

      img {
        cursor: pointer;
        width: 100%;
        padding: 0px;
        opacity: 1;
        border: 4px solid transparent;
        transition: all 0.15s ease-in-out;

        &.main {
          opacity: 1;
          border: 4px solid #0063e2;
        }
      }
    }
  }

  .errors-block {
    &__item {
      .v-alert__content {
        font-size: 0.85rem;
      }
    }
  }

  .main-search-container {
    width: 100%;
    padding: 1rem;
  }

  .sibebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 1rem;
  }

  .no-items {
    padding-top: 1rem;
    color: red;
  }
}

.selected-image {
  padding: 1rem;
  border-bottom: 1px solid #ddd;

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
