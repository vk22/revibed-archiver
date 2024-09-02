<template>
  <v-container fluid>
    <div class="input-wrap">
      <input type="text" v-model="searchQuery" placeholder="" />
    </div>
    <v-row
      v-if="Object.keys(ripsOnPage).length"
      class="rips-list"
      ref="rips"
      v-on:scroll="handleScroll()"
    >
      <v-col md="12">
        <v-simple-table>
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
              <tr v-for="(rip, index) in ripsOnPage" :key="index">
                <td>{{ rip.title }}</td>
                <td>{{ rip.releaseID }}</td>
                <td>{{ rip.labelName }}</td>
                <td>{{ rip.labelID }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
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

<script>
function debounce(fn, delay) {
  var timeoutID = null
  return function () {
    clearTimeout(timeoutID)
    var args = arguments
    var that = this
    timeoutID = setTimeout(function () {
      fn.apply(that, args)
    }, delay)
  }
}

export default {
  components: {},
  async fetch() {
    this.$store.dispatch('getRips')
  },
  data() {
    return {
      sideNav: true,
      show: true,
      searchQuery: '',
      isSearching: false,
      ripsOnPage: [],
      ripsInStoreFiltered: [],
      ripsToAddOnPage: [],
      ripsForGettingCount: 128,
      ripsOnPageCount: 0
    }
  },
  methods: {
    getRipsByPage(ripsInStore, action) {
      if (action !== 'scroll') {
        this.ripsOnPageCount = 0
        this.ripsForGettingCount = 128
      }
      this.ripsToAddOnPage = ripsInStore.slice(
        this.ripsOnPageCount,
        this.ripsOnPageCount + this.ripsForGettingCount
      )
      this.ripsOnPageCount = this.ripsOnPageCount + this.ripsForGettingCount
      if (!this.ripsOnPage.length) {
        this.ripsOnPage = [].concat(this.ripsToAddOnPage)
      } else {
        if (action === 'scroll') {
          this.ripsOnPage = this.ripsOnPage.concat(this.ripsToAddOnPage)
        } else {
          this.ripsOnPage = [].concat(this.ripsToAddOnPage)
        }
      }
    },
    handleScroll() {
      let bottomOfWindow =
        document.documentElement.scrollTop + window.innerHeight ===
        document.documentElement.offsetHeight
      if (bottomOfWindow) {
        console.log('подгрузка')
        //this.$store.commit('getRipsByPage', 'scroll')
        this.getRipsByPage(this.ripsInStore, 'scroll')
      }
    }
  },
  mounted() {
    console.log('ripsInStore ', ripsInStore)
    window.addEventListener('scroll', this.handleScroll)
    //this.$store.commit('getRipsByPage', 'start')
    this.getRipsByPage(this.ripsInStore, 'start')
  },
  computed: {
    ripsInStore() {
      return this.$store.getters.getRips
    },
    filesPath() {
      return this.$store.getters.getFilesPath
    }
  },
  watch: {
    ripsInStore: function (query) {
      //this.$store.commit(query, 'filter')
      this.getRipsByPage(query, 'filter')
    },
    searchQuery: debounce(function (query) {
      if (this.isInputFunctionRunning) {
        return
      }
      this.isInputFunctionRunning = true
      console.log('query ', query)
      this.$store.commit('searchRips', query)
      this.isInputFunctionRunning = false
    }, 1000)
  },
  created() {}
}
</script>

<style lang="scss">
.rips-list {
  padding: 1rem;
}
</style>
