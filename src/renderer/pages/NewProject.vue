<template>
  <!-- content -->
  <v-container fluid class="pa-0">
    <div class="dropzone" v-if="!folderFilesReady" :class="{ active: isHover }">
      <span>Drop folder here</span>
    </div>
    <!-- -->

    <v-dialog v-model="dialog" max-width="450">
      <v-card>
        <v-card-text>
          <!-- ReleaseData -->
          <v-container>
            <v-row class="release-data">
              <v-col cols="4">
                <div class="cover-item" v-if="rip.images">
                  <img :src="rip.images[0].uri" alt="" />
                </div>
              </v-col>
              <v-col cols="8">
                <div class="tag-item">
                  <div class="label">Album</div>
                  <div class="data">{{ rip.title }}</div>
                </div>
                <div class="tag-item">
                  <div class="label">Artist</div>
                  <div class="data">{{ rip.artist }}</div>
                </div>
                <div class="tag-item">
                  <div class="label">Country</div>
                  <div class="data">{{ rip.country }}</div>
                </div>
                <div class="tag-item">
                  <div class="label">Year</div>
                  <div class="data">{{ rip.year }}</div>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <div class="release-tracklist" :class="{ 'has-error': hasError }">
                  <legend>Tracklist</legend>
                  <div v-for="(track, index) in rip.tracklist" :key="index" class="track">
                    {{ track.position }}. {{ track.title }} -
                    <span v-if="track.duration"> {{ track.duration }}</span>
                  </div>
                </div>
                <div v-if="hasError" class="has-error">
                  <b>{{ errorMessage }}</b>
                </div>
              </v-col>
            </v-row>
          </v-container>
          <!-- ReleaseData -->
        </v-card-text>

        <v-card-actions>
          <v-row>
            <v-col>
              <div class="buttons-block d-flex">
                <button class="btn" @click="store.dialog = false">Save</button>
                <button class="btn" @click="downloadDiscogsImages()">Download Images</button>
              </div>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- top panel -->
    <TopToolsPanel />
    <!-- source panel -->
    <SourcePanel />
    <div class="folder-container" v-if="folderFilesReady">
      <div class="folder-files" v-if="folderFiles.files.length">
        <!-- <div class="folder-files__title">FILES</div> -->
        <v-data-table
          :headers="headers"
          :items="folderFiles.files"
          :single-select="true"
          density="compact"
          :hide-default-footer="true"
        >
          <template v-slot:header="{ props }">
            <th v-for="head in props.headers" :key="head">{{ head.text }}</th>
          </template>
          <template v-slot:item="{ item }">
            <tr
              :class="{
                active: item.filename === selectedTrack.filename,
                'has-error': item.errors.length
              }"
              @click="selectRow(item)"
            >
              <td>{{ item.filename }}</td>
              <td>{{ item.metadata.title }}</td>
              <td>
                <span v-if="Array.isArray(item.metadata.performers)">{{
                  item.metadata.performers.join(', ')
                }}</span>
                <span v-else>{{ item.metadata.performers }}</span>
              </td>
              <td>{{ item.metadata.album }}</td>
              <td>
                <span v-if="Array.isArray(item.metadata.genres)">{{
                  item.metadata.genres.join(', ')
                }}</span>
                <span v-else>{{ item.metadata.genres }}</span>
              </td>
              <td style="width: 100px">{{ item.metadata.year }}</td>
              <td style="width: 100px">{{ item.sampleRate }}</td>
              <td style="width: 100px">{{ item.bitsPerSample }}</td>
              <td style="width: 100px">{{ $filters.minutes(item.duration) }}</td>
            </tr>
          </template>

          <template v-slot:bottom> </template>
        </v-data-table>
        <!-- <div
          class="folder-files__item"
          v-for="(file, i) in folderFiles.files"
          :key="i"
          link
        >
          <div class="name">{{ file.filename }}</div>
          <div class="title">{{ file.metadata.title }}</div>
          <div class="performers">{{ file.metadata.performers }}</div>
          <div class="album">{{ file.metadata.album }}</div>
          <div class="genres">{{ file.metadata.genres }}</div>
          <div class="year">{{ file.metadata.year }}</div>
        </div> -->
      </div>
    </div>
    <!-- checked files -->
    <CheckedFiles></CheckedFiles>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import CheckedFiles from '@/renderer/components/CheckedFiles.vue'
import TopToolsPanel from '@/renderer/components/TopToolsPanel.vue'
import SourcePanel from '@/renderer/components/SourcePanel.vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

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
const dialog = computed(() => {
  return store.dialog
})
const rip = computed(() => {
  return store.rip
})

/// data
const headers = ref([
  {
    title: 'Filename',
    align: 'start',
    sortable: false,
    value: 'filename'
  },
  { title: 'Title', value: 'metadata.title', sortable: false },
  { title: 'Artist', value: 'metadata.performers', sortable: false },
  { title: 'Album', value: 'metadata.album', sortable: false },
  { title: 'Genres', value: 'metadata.genres', sortable: false },
  { title: 'Year', value: 'metadata.year', sortable: false },
  { title: 'Sample Rate', value: 'sampleRate', sortable: false },
  { title: 'Bits Per Sample', value: 'bitsPerSample', sortable: false },
  { title: 'Duration', value: 'duration', sortable: false }
  // { text: "Errors", value: "errors", sortable: false },
])
let selectedTrack = ref({})
let sideNav = ref(true)
let isHover = ref(false)
let ApiResponse = ''
let releaseData = undefined
let show = true
let responseStatus = false
let responseMessage = undefined
let loading = false
let hasError = false
let errorMessage = ''

/// Methods

const downloadDiscogsImages = (visual) => {
  store.downloadDiscogsImages()
}

const selectRow = (item) => {
  selectedTrack.value = item
  store.setSelectedTrack(item)
}

function debounce(callee, timeoutMs) {
  return function perform(...args) {
    let previousCall = this.lastCall
    let lastCall = Date.now()
    if (previousCall && lastCall - previousCall <= timeoutMs) {
      clearTimeout(lastCallTimer)
    }
    let lastCallTimer = setTimeout(() => callee(...args), timeoutMs)
  }
}

onMounted(() => {
  window.addEventListener('drop', (event) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('event.dataTransfer.files ', event.dataTransfer.files)
    for (const f of event.dataTransfer.files) {
      // Using the path attribute to get absolute file path
      console.log('File Path of dragged files: ', f.path)
      // this.folderPath = f.path + "/";
      store.setFolderPath(f.path + '/')
    }
    const checkDropedFolderDebounced = debounce(store.checkDropedFolder(), 5000)
    checkDropedFolderDebounced()

    // this.folderPath = f.path
  })

  window.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  window.addEventListener('dragenter', (event) => {
    console.log('File is in the Drop Space', event)
    isHover.value = true
  })

  window.addEventListener('dragleave', (event) => {
    console.log('File has left the Drop Space', event)
    isHover.value = false
  })
})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.v-overlay__content {
  .v-card {
    border-radius: 10px !important;

    .v-card-text {
      padding: 1rem !important;
      color: #111 !important;

      .col {
        padding: 8px;
      }
    }

    .v-card-actions {
      padding: 0 1.5rem 1.5rem !important;
    }

    .release-data {
      //border: 1px solid #e0e0e0;
      margin-top: 0rem;

      .cover-item {
        img {
          width: 100%;
        }
      }

      .tag-item {
        padding: 1px 4px;
        display: flex;

        .label {
          font-weight: 600;
          width: 100px;
          flex-basis: 30%;
        }

        .data {
          flex-basis: 70%;
        }
      }
    }

    .release-tracklist {
      padding: 0rem;
      // background: #f5f5f5;
    }

    .release-tracklist legend {
      margin-bottom: 10px;
      font-size: 14px;
    }

    .buttons-block {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .btn {
        margin-right: 0.5rem;
      }
    }
  }
}

table {
  tbody {
    tr {
      &:hover {
        cursor: pointer;
        background: transparent !important;
      }

      &:nth-of-type(odd) {
        background-color: rgba(0, 0, 0, 0.05);

        &:hover {
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.05) !important;
        }

        &.active {
          background: $color_main !important;
          color: #fff !important;
        }
      }

      &.active {
        background: $color_main !important;
        color: #fff !important;
      }
    }
  }

  td {
    // font-size: .875rem;
    // height: 36px!important;
  }
}

.dropzone {
  position: relative;
  width: calc(100% - 2rem);
  height: calc(100vh - 7rem);
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  border: 2px dashed #9e9e9e;
  border-radius: 5px;
  margin: 1rem;

  &.active {
    border: 2px dashed #1357a4;
  }
}

.parse-release-form {
  max-width: 1200px;
  margin: 0 auto;
  //flex-basis: 500px;
  padding-bottom: 10%;
  opacity: 1;
  transition: opacity 0.5s ease;

  &.loading {
    opacity: 0.5;
  }

  .form-wrap {
    padding-top: 1rem;
  }
}

legend {
  font-weight: 600;
}

.errors {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px dashed red;
  border-radius: 4px;
}

.has-error {
  color: red;
}

.success {
  color: green;
}

.theme--light.v-text-field--outlined:not(.v-input--is-focused):not(.v-input--has-state)
  > .v-input__control
  > .v-input__slot
  fieldset {
  color: rgb(0 0 0 / 15%) !important;
}
</style>
@/renderer/store/main
