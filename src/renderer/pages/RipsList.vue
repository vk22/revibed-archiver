<template>
  <v-container fluid class="pa-0">
    <div class="releases-filters-tool">
      <v-row>
        <v-col>
          <FilterReleases></FilterReleases>
          <button class="btn mr-2" @click="addToRVBD()" :class="{ disable: selected.length === 0 }"
            >Add to Revibed</button
          >
          <button
            class="btn mr-2"
            @click="addToYoutube()"
            :class="{ disable: selected.length === 0 }"
            >Add to Youtube</button
          >
        </v-col>
        <v-col class="d-flex align-center">
          <div class="stats-block">
            <div>
              On Youtube: <b>{{ onYoutubeCount }}</b>
            </div>
            <div>
              On Revibed: <b>{{ onRevibedCount }}</b>
            </div>
            <div>
              Total releases: <b>{{ allReleasesCount }}</b>
            </div>
            <div>
              Filtered: <b>{{ releases.length }}</b>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
    <v-row
      v-if="Object.keys(ripsList).length"
      class="releases-list"
      ref="rips"
      v-on:scroll="handleScroll()"
    >
      <v-col md="12">
        <div class="search-container">
          <v-text-field
            v-model="search"
            label="Search"
            prepend-inner-icon="mdi-magnify"
            single-line
            variant="outlined"
            hide-details
            density="compact"
          ></v-text-field>
        </div>

        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="ripsList"
          :search="search"
          :single-select="true"
          density="compact"
          :hide-default-footer="true"
          show-select
          item-value="_id"
          items-per-page="100"
        >
          <template v-slot:item.cover="{ item }">
            <router-link :to="{ name: 'RipPage', params: { id: item.releaseID } }">
              <img
                :src="'file://' + storageFolder + '/' + item.releaseID + '/VISUAL/Front.jpg'"
                @error="
                  $event.target.src =
                    'file://' + storageFolder + '/' + item.releaseID + '/VISUAL/A.jpg'
                "
                class="cover-img"
              />
            </router-link>
          </template>

          <template v-slot:item.title="{ item }">
            <router-link :to="{ name: 'RipPage', params: { id: item.releaseID } }">
              {{ item.title }}
            </router-link>
          </template>
          <template v-slot:item.updated="{ item }">
            {{ formatDateEn(item.updated) }}
          </template>
          <template v-slot:item.onRevibed="{ item }">
            <a
              :href="` https://revibed.com/marketplace/${item.onRevibed.id}`"
              class="table-item__youtubeLink"
              v-if="item.onRevibed.forSale"
              target="_blank"
              >{{ item.onRevibed.id }}</a
            >
            <span v-else class="grey">
              {{ item.onRevibed.id }}
            </span>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col class="loading-screen-container">
        <div class="loading-screen">
          <v-progress-circular color="black" indeterminate rounded height="6"></v-progress-circular>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import FilterReleases from '@/renderer/components/FilterReleases.vue'
import { onMounted, computed, watch } from 'vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

const ripsList = computed(() => {
  return store.getReleases
})

const storageFolder = computed(() => {
  return store.getStorageFolder
})

const selected = ref([])
const search = ref('')
watch(selected, (newValue, oldValue) => {
  console.log(`watch: selected changed from ${oldValue} to ${newValue}`)
})

const addToRVBD = async () => {
  await store.exportReleasesToRVBD(selected.value)
}

const addToYoutube = async () => {
  await store.exportReleasesToYoutube(selected.value)
}
const formatDateEn = (date) => {
  //console.log('formatDate locale ', state.locale)
  var monthsArr = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec'
  ]
  date = new Date(date)
  const dd = (date.getDate() < 10 ? '0' : '') + date.getDate()
  const MM = monthsArr[date.getMonth()]
  const yyyy = date.getFullYear()
  return dd + ' ' + MM + ' ' + yyyy
}

const allReleasesCount = computed(() => {
  return store.getAllReleases.length
})

const releases = computed(() => {
  return store.getReleases
})

const onYoutubeCount = computed(() => {
  return store.getOnYoutubeCount
})

const onRevibedCount = computed(() => {
  return store.getOnRevibedCount
})

/// data
const headers = ref([
  { key: 'cover', title: 'Cover' },
  { key: 'title', title: 'Title' },
  { key: 'artist', title: 'Artist' },
  { key: 'releaseID', title: 'Discogs Release' },
  { key: 'source', title: 'Source' },
  { key: 'youtubeVideoID', title: 'Youtube Link' },
  { key: 'onRevibed', title: 'Revibed' },
  { key: 'updated', title: 'Date' }
  // { text: "Errors", value: "errors", sortable: false },
])

onMounted(() => {})
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.loading-screen-container {
  position: relative;
}

.loading-screen {
  position: absolute;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  margin: 0 !important;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  color: #fff;
  border-radius: 0;
  padding-top: 25%;

  .v-progress-circular {
    color: mediumvioletred;
  }

  &.success-message {
    background: #ccffe58c;
  }

  p {
    margin-bottom: 0px !important;
  }
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
