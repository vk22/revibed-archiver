<template>
  <v-container fluid class="pa-0" v-if="ripsList">
    <div class="releases-filters-tool">
      <v-row>
        <v-col>
          <FilterReleases></FilterReleases>
          <button class="btn mr-2" @click="addToRVBD()" :class="{ disable: selected.length === 0 }">Add to
            Revibed</button>
          <button class="btn mr-2" @click="addToYoutube()" :class="{ disable: selected.length === 0 }">Add to
            Youtube</button>
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
    <v-row v-if="Object.keys(ripsList).length" class="releases-list" ref="rips" v-on:scroll="handleScroll()">
      <v-col md="12">
        <div class="search-container">
          <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" single-line variant="outlined"
            hide-details density="compact"></v-text-field>
        </div>

        <v-data-table v-model="selected" :headers="headers" :items="ripsList" :search="search" :single-select="true"
          density="compact" :hide-default-footer="true" show-select item-value="_id" items-per-page="200">
          <template v-slot:item.updated="{ item }">
            {{ formatDateEn(item.updated) }}
          </template>
          <template v-slot:item.onRevibed="{ item }">
            <a :href="` https://revibed.com/marketplace/${item.onRevibed.id}`" class="table-item__youtubeLink"
              v-if="item.onRevibed.forSale" target="_blank">{{ item.onRevibed.id }}</a>
            <span v-else class="grey">
              {{ item.onRevibed.id }}
            </span>
          </template>
        </v-data-table>

        <!-- <v-simple-table>
          <template v-slot:default>
            <thead>
              <tr>
                <th class="text-left"> title </th>
                <th class="text-left"> releaseID </th>
                <th class="text-left"> labelName </th>
                <th class="text-left"> labelID </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rip, index) in ripsList" :key="index">
                <td>{{ rip.title }}</td>
                <td>{{ rip.releaseID }}</td>
                <td>{{ rip.labelName }}</td>
                <td>{{ rip.labelID }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table> -->
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col>
        <!-- <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular> -->
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
  { key: 'source', title: 'Source' },
  { key: 'releaseID', title: 'Discogs Release' },
  { key: 'artist', title: 'Artist' },
  { key: 'title', title: 'Title' },
  { key: 'youtubeVideoID', title: 'Youtube Link' },
  { key: 'updated', title: 'Date' },
  { key: 'onRevibed', title: 'Revibed' }
  // { text: "Errors", value: "errors", sortable: false },
])

onMounted(() => { })
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.releases-list {
  padding: 0rem;
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
</style>
@/renderer/store/main
