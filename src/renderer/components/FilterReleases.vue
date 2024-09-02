<template>
  <div class="filter-popover text-center mr-2">
    <v-menu v-model="menu" :close-on-content-click="false" location="end">
      <template v-slot:activator="{ props }">
        <button
          class="btn outline with-icon"
          v-bind="props"
          :class="{ checked: filterStateStore.length }"
          ><v-icon icon="mdi-filter-variant"></v-icon> Filter</button
        >
      </template>

      <v-card min-width="300" class="popup-filter">
        <!-- <v-list>
          <v-list-item>
            <div class="filter-item-wrap">
              <CustomSelect
                :options="allSources"
                :default="sourceSelected"
                class="select"
                @input="changeFilterSource($event)"
              />
            </div>
          </v-list-item>
        </v-list>

        <v-divider></v-divider> -->

        <v-list>
          <v-list-item>
            <v-checkbox
              @change="changeFilterYoutube"
              v-model="filterYoutube"
              label="Youtube Copyrights"
            >
            </v-checkbox>
          </v-list-item>

          <v-list-item>
            <v-checkbox
              @change="changeFilterYoutube2"
              v-model="filterYoutube2"
              label="Youtube Not Uploaded"
            >
            </v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              @change="changeFilterDiscogs"
              v-model="filterDiscogs"
              label="Discogs Warnings Labels"
            >
            </v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              @change="changeFilterVarious"
              v-model="filterVarious"
              label="Various Artists"
            >
            </v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox @change="changeFilterOnRevibed" v-model="filterOnRevibed" label="OnRevibed">
            </v-checkbox>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-list-item>
            <v-checkbox
              class="filter-checkbox"
              @change="changeFilterGetGood"
              v-model="filterGetGood"
              label="Good Releases"
            >
            </v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              class="filter-checkbox"
              @change="changeFilterAddToRVBD"
              v-model="filterAddToRVBD"
              label="Add to RVBD"
            >
            </v-checkbox>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CustomSelect from '@/renderer/components/CustomSelect.vue'

// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const menu = ref(false)
const allSources = ['All', 'KX', 'Anton', 'KX Balance']
const sourceSelected = 'All'

const filterStateStore = computed(() => {
  return store.getFilterState
})

const filterYoutube = computed({
  get() {
    return store.getReleasesFilter.youtube
  },
  set(value) {
    store.resetReleasesFilter3
    store.setReleasesFilter({ item: 'youtube', value: value })
  }
})

const filterYoutube2 = computed({
  get() {
    return store.getReleasesFilter.youtube2
  },
  set(value) {
    store.resetReleasesFilter3
    store.setReleasesFilter({ item: 'youtube2', value: value })
  }
})

const filterDiscogs = computed({
  get() {
    return store.getReleasesFilter.discogs
  },
  set(value) {
    store.resetReleasesFilter3
    store.setReleasesFilter({ item: 'discogs', value: value })
  }
})

const filterVarious = computed({
  get() {
    return store.getReleasesFilter.various
  },
  set(value) {
    store.resetReleasesFilter3
    store.setReleasesFilter({ item: 'various', value: value })
  }
})

const filterOnRevibed = computed({
  get() {
    return store.getReleasesFilter.onRevibed
  },
  set(value) {
    store.resetReleasesFilter3
    store.setReleasesFilter({ item: 'onRevibed', value: value })
  }
})

const filterGetGood = computed({
  get() {
    return store.getReleasesFilter.goodReleases
  },
  set(value) {
    store.resetReleasesFilter1
    store.setReleasesFilter({ item: 'goodReleases', value: value })
  }
})

const filterAddToRVBD = computed({
  get() {
    return store.getReleasesFilter.addToRVBD
  },
  set(value) {
    store.resetReleasesFilter2
    store.setReleasesFilter({ item: 'addToRVBD', value: value })
  }
})

///

const changeFilterYoutube = (event) => {
  console.log('changeFilterYoutube ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'youtube' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'youtube' })
  }
}

const changeFilterYoutube2 = (event) => {
  console.log('changeFilterYoutube2 ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'youtube2' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'youtube2' })
  }
}

const changeFilterDiscogs = (event) => {
  console.log('changeFilterDiscogs ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'discogs' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'discogs' })
  }
}

const changeFilterVarious = (event) => {
  console.log('changeFilterVarious ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'various' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'various' })
  }
}

const changeFilterOnRevibed = (event) => {
  console.log('changeFilterOnRevibed ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'onRevibed' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'onRevibed' })
  }
}

const changeFilterGetGood = (event) => {
  console.log('changeFilterOnRevibed ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'goodReleases' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'goodReleases' })
  }
}

const changeFilterAddToRVBD = (event) => {
  console.log('changeFilterOnRevibed ', event.target.checked)
  if (event.target.checked) {
    store.setFilteredState2({ action: 'add', value: 'addToRVBD' })
  } else {
    store.setFilteredState2({ action: 'remove', value: 'addToRVBD' })
  }
}
</script>

<style lang="scss">
.checked {
  background: #2f2f2f !important;
  color: #fff !important;
}
.filter-popover {
  display: inline-block;
}

.v-list-item--density-default.v-list-item--one-line {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

.v-checkbox {
  height: 35px;
  width: 230px;
}
.v-checkbox .v-selection-control {
  min-height: 34px !important;
}
.v-input__details {
  display: none;
}

.filter-item-wrap {
  margin: 7px 0 6px;
  padding: 3px;
}

.v-overlay-container {
  .custom-select .items {
    position: fixed !important;
    width: 262px !important;
    left: 19px !important;
    right: 0 !important;
    z-index: 99999 !important;
  }

  .popup-filter {
    .v-label {
      font-size: 0.9rem;
    }
  }
}
</style>
