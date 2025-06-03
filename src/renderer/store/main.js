import { defineStore } from 'pinia'
import axios from 'axios'
import { isProxy, toRaw } from 'vue'

//const API_URL_TOOLS = 'http://localhost:3000';
const API_URL_TOOLS = 'https://tools.revibed.com/api'
const API_URL_REVIBED = 'https://system-api.revibed.com'
const API_TOKEN_REVIBED = 'ozs6tZrfHNCSS4HnfRPvpvgVGbBj2JakfPyEXAtJcXukGNxCouBW2Gs6z7STZEfVyh4Tmg'

export const useMainStore = defineStore('main', {
  state: () => ({
    allReleases: [],
    releases: [],
    tracks: [],
    youtubes: [],
    artists: [],
    countries: [],
    projectsFiltered: [],
    backup: {},
    allDataInStore: false,
    restoredFilesList: [],
    filesPath: undefined,
    folderPath: undefined,
    folderDroppedData: [],
    folderDropped: false,
    folderFilesReady: false,
    loading: false,
    playerIsActive: false,
    selectedTrack: null,
    mainImage: {
      filename: undefined,
      filepath: undefined
    },
    rip: {
      releaseID: '',
      projectID: '',
      description: '',
      needSpectro: true,
      needFLAC: true,
      artist: undefined,
      title: undefined,
      year: undefined,
      country: undefined,
      styles: undefined,
      tracklist: undefined,
      restoredFilesList: [],
      updated: {},
      errors: [],
      noFiles: false
    },
    sourceData: {
      owner: undefined,
      condition: undefined,
      quality: undefined
    },
    canSave: false,
    discogsLinkTemp: undefined,
    discogsRequest: false,
    dialog: false,
    globalErrors: undefined,
    discogsImages: undefined,
    selectedVisual: {
      filename: undefined,
      filepath: undefined
    },
    matchType: 'match-by-position',
    discogsMergeSubtracks: false,
    /// Filter
    filterState: [],
    releasesFilter: {
      youtube: false,
      youtube2: false,
      discogs: false,
      various: false,
      onRevibed: false,
      goodReleases: false,
      addToRVBD: false
    },
    onYoutubeCount: 0,
    onRevibedCount: 0,
    storageFolder: undefined
  }),
  actions: {
    setLoading(data) {
      if (data.finish) showNotification(data.message)
      this.loading = data.state
    },
    setFolderPath(path) {
      this.folderPath = path
    },
    setSelectedVisual(data) {
      this.selectedVisual = data
    },
    setMainImage(path) {
      this.mainImage = path
    },
    async getRevibedGoods() {
      const response = await axios.get(`${API_URL_REVIBED}/goods?size=5000`, {
        headers: { Authorization: `Bearer ${API_TOKEN_REVIBED}` }
      })
      return response
    },
    async getYoutubes() {
      const response = await axios.get(`${API_URL_TOOLS}/get-youtubes`)
      return response
    },
    async getLabels() {
      const response = await axios.get(`${API_URL_TOOLS}/get-labels`)
      return response
    },
    async getArtists() {
      const response = await axios.get(`${API_URL_TOOLS}/get-artists`)
      return response
    },
    async getServerDataReleases() {
      const response = await axios.get(`${API_URL_TOOLS}/get-releases`, {
        headers: {
          'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
        }
      })
      return response
    },
    async getTracks() {
      const response = await axios.get(`${API_URL_TOOLS}/get-tracks`, {
        headers: {
          'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
        }
      })
      return response
    },
    async checkRelease(releaseID) {
      const response = await axios.post(
        `${API_URL_TOOLS}/check-release`,
        { releaseID: releaseID },
        {
          headers: {
            'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
          }
        }
      )
      return response
    },
    async getServerData() {
      console.time('getAllData')
      this.allDataReady = false

      const getRevibedGoodsData = await this.getRevibedGoods()
      console.log('getRevibedGoodsData response ', getRevibedGoodsData.data.data.length)
      if (getRevibedGoodsData.data.success) {
        this.setRevibedGoods(getRevibedGoodsData.data.data)
      }

      const getReleasesData = await this.getServerDataReleases()
      console.log('getReleases response ', getReleasesData.data)
      if (getReleasesData.data.success) {
        this.setReleases(getReleasesData.data)
      }
      this.userLocalFolders = await window.mainApi.invoke('getUserLocalData')
      this.storageFolder = toRaw(this.userLocalFolders).storageFolder
      console.log('storageFolder ', this.storageFolder)
      this.allDataReady = true
      console.timeEnd('getAllData')
      const getTracksData = await this.getTracks()
      console.log('getTracksData ', getTracksData)
      if (getTracksData.data.success) {
        this.tracks = getTracksData.data.tracks
      }
    },
    setRevibedGoods(data) {
      console.log('setRevibedGoods ', data.length)
      const goods = data
      // goods.forEach(item => {
      //   if (!item.published) {
      //     console.log(item)
      //   }
      // })
    },
    setYoutubes(data) {
      this.youtubes = data.youtubes
    },
    setLabels(data) {
      console.time('setLabels')
      this.allLabels = [...data.labels]

      let labelsSorted = []
      let releasesAdded = []

      data.labels.map((item) => {
        releasesAdded = releasesAdded.concat(item.subreleases)
        item.count = item.subreleases.length
        if (item.count) {
          labelsSorted.push(item)
        }
      })
      // console.log('labelsSorted ', labelsSorted)
      // console.log('releasesAdded ', releasesAdded)

      data.labels.map((item) => {
        let findRel = 0
        item.releases.forEach((el) => {
          let find = releasesAdded.indexOf(el)
          if (find === -1) {
            releasesAdded.push(el)
            findRel += 1
          }
        })
        if (true) {
          let index = labelsSorted.findIndex((el) => el.id === item.id)
          if (index === -1) {
            item.count = findRel
            labelsSorted.push(item)
          } else {
            labelsSorted[index].count += findRel
          }
        }
      })
      // console.log('releasesAdded 2', releasesAdded)
      this.releasesAdded = releasesAdded
      labelsSorted.sort((a, b) => b.count - a.count)
      this.sortedLabels = labelsSorted
      console.timeEnd('setLabels')
    },
    setArtists(data) {
      data.artists.sort((a, b) => {
        return b.releases.length - a.releases.length
      })
      this.artists = data.artists
    },
    setReleases(data) {
      // console.log('setReleases', data)
      this.allReleases = [].concat(data.releases).concat(data.notGoods)
      this.releases = data.releases
      this.sortedLabels = data.labels
      this.artists = data.artists
      this.onRevibedCount = data.onRevibedCount
      this.onYoutubeCount = data.onYoutubeCount
      this.countries = data.countries
    },
    async checkDropedFolder() {
      console.log('checkDropedFolder Store')
      this.setLoading({ state: true })
      const response = await window.mainApi.invoke('checkDropedFolder', {
        folder: this.folderPath
      })
      console.log('checkDropedFolder response ', response)
      if (response.success) {
        this.setDropedData(response)
      }
      this.setLoading({ state: false, finish: false })
    },
    setDropedData(data) {
      console.log('setDropedData')
      this.folderDropped = true
      this.folderDroppedData = data.files
      if (this.folderDroppedData.visual.length) {
        if (!this.mainImage) {
          this.mainImage = this.folderDroppedData.visual[0]
        }
      }
      if (data.files.errors) {
        this.globalErrors = data.files.errors
      }
      if (data.errors) {
        this.globalErrors = data.errors
      }
      this.folderFilesReady = true
    },
    setSourceData(key, value) {
      this.sourceData[key] = value
      console.log('this.sourceData[key] ', this.sourceData[key])
    },
    async getFilesFromFolder() {
      this.setLoading({ state: true })
      const response = await window.mainApi.invoke('getFilesFromFolder', {
        folder: this.folderPath
      })
      console.log('getFilesFromFolder response ', response)
      if (response.success) {
        this.setFilesData(response)
      }
      this.setLoading({ state: false, finish: false })
    },
    setFilesData(data) {
      console.log('setFilesData')
      this.folderDroppedData = data.files
      if (data.files.errors) {
        this.globalErrors = data.files.errors
      }
    },
    async downloadDiscogsImages() {
      this.setLoading({ state: true })
      const response = await window.mainApi.invoke('downloadDiscogsImages', {
        folder: this.folderPath
      })
      // const { data } = await axios.post(`http://localhost:8000/api/download-discogs-images/`)
      console.log('data response ', response)
      if (response.success) {
        this.discogsImages = response.images
        await this.getFilesFromFolder()
        this.setLoading({ state: false, finish: false })
      }
    },
    async parseDiscogs(releaseID) {
      this.setLoading({ state: true })
      const response = await window.mainApi.invoke('parseRelease', {
        releaseID: releaseID,
        folder: this.folderPath,
        discogsMergeSubtracks: this.discogsMergeSubtracks
      })
      // const { data } = await axios.post(`http://localhost:8000/api/parse-discogs-link/`, {
      //   releaseID: releaseID,
      //   folder: this.folderPath,
      //   discogsMergeSubtracks: this.discogsMergeSubtracks
      // })
      // console.log('parseDiscogs response ', response)
      if (response.releaseData) {
        this.rip.title = response.releaseData.title
        this.rip.artist = response.releaseData.artist
        this.rip.year = response.releaseData.year
        this.rip.country = response.releaseData.country
        this.rip.format = response.releaseData.format
        this.rip.tracklist = response.releaseData.tracklist
        this.rip.images = response.releaseData.images
        this.rip.styles = response.releaseData.styles
        this.releaseData = true
        this.rip.errors = response.errors
        this.folderTemp = response.folderTemp
        this.discogsRequest = true
        this.canSave = true
        this.dialog = true
        this.setLoading({ state: false })
        await this.getFilesFromFolder()
      } else {
        this.setLoading({ state: false })
        alert('DiscogsError: The requested resource was not found')
      }
    },
    async setDiscogsTags() {
      if (this.mainImage.filepath) {
        this.setLoading({ state: true })
        // console.log('this.mainImage ', this.mainImage)
        // console.log('this.matchType ', this.matchType)
        const mainImageParced = JSON.parse(JSON.stringify(this.mainImage))
        const response = await window.mainApi.invoke('setDiscogsTags', {
          mainImage: mainImageParced,
          matchType: this.matchType
        })
        // const { data } = await axios.post(`http://localhost:8000/api/set-discogs-tags/`, {
        //   mainImage: this.mainImage,
        //   matchType: this.matchType
        // })

        console.log('setDiscogsTags response ', response)
        if (response.success) {
          await this.getFilesFromFolder()
        }
        this.setLoading({ state: false, finish: false })
      } else {
        alert('Choose main image')
      }
    },
    async setTrackID3Tags(selectedTrack) {
      console.log('setTrackID3Tags STORE selectedTrack ', selectedTrack)
      const response = await window.mainApi.invoke('setID3TagsOneTrack', {
        metadata: selectedTrack.metadata,
        filepath: selectedTrack.filepath
      })
      // const response = await axios.post('http://localhost:8000/api/set-metadata-one-track', {
      //   metadata: selectedTrack.metadata,
      //   filepath: selectedTrack.filepath
      // })
      console.log('setTrackID3Tags response ', response)
    },
    async archiveProject() {
      this.setLoading({ state: true })
      // console.log('this.sourceData ', this.sourceData)
      const sourceDataParced = JSON.parse(JSON.stringify(this.sourceData))
      const response = await window.mainApi.invoke('archiveProject', {
        source: sourceDataParced
      })
      // const { data } = await axios.post(`http://localhost:8000/api/archive-project/`, {
      //   source: this.sourceData
      // })
      console.log('archiveProject ', response)
      if (response.success) {
        this.setLoading({
          state: false,
          finish: true,
          message: {
            title: response.result.archiver.success
              ? response.result.archiver.message
              : 'Archiver Error',
            body: response.result.revibed.success
              ? response.result.revibed.message
              : 'Revibed Error'
          }
        })
        this.$reset
      }
    },
    async editImage(imageData) {
      console.log('imageData ', imageData)
      const response = await window.mainApi.invoke('editImage', imageData)
      // const { data } = await axios.post('http://localhost:8000/api/edit-image', imageData)
      if (response.success) {
        this.selectedVisual = {
          filename: undefined,
          filepath: undefined
        }
        await this.getFilesFromFolder()
      }
    },
    async deleteFile(filename) {
      this.setLoading({ state: true })
      const response = await window.mainApi.invoke('deleteFile', {
        filename: filename
      })
      // const { data } = await axios.post(`http://localhost:8000/api/delete-file/`, {
      //   filename: filename
      // })
      if (response.success) {
        await this.getFilesFromFolder()
        this.setLoading({ state: false, finish: false })
      }
    },
    async checkFiles() {
      this.setLoading({ state: true })
      // const { data } = await axios.post(`http://localhost:8000/api/check-files/`);
      const response = await window.mainApi.invoke('checkFiles')
      console.log('checkFiles STORE response ', response)
      if (response.success) {
        console.log('checkFiles response ', response)
        this.setLoading({ state: false, finish: false })
        // this.restoredFilesList = response.data.restoredFilesList
      }
    },
    setSelectedTrack(data) {
      this.selectedTrack = data
    },
    clearState() {
      console.log('clearState')
      this.$reset()
    },
    ///// Filter
    setFilteredState(data) {
      console.log('setFilteredState ', data)
      this.filterState = data
    },
    setFilteredState2(data) {
      console.log('setFilteredState2 ', data)
      if (data.action === 'add') {
        if (data.value === 'goodReleases' || data.value === 'addToRVBD') {
          this.filterState = []
        }
        this.filterState.push(data.value)
      } else if (data.action === 'remove') {
        let index = this.filterState.indexOf(data.value)
        console.log('index ', index)
        if (index !== -1) {
          this.filterState.splice(index, 1)
        }
      }
    },
    resetReleasesFilter1(data) {
      this.releasesFilter = {
        youtube: false,
        youtube2: false,
        discogs: false,
        various: false,
        onRevibed: false,
        addToRVBD: false
      }
    },
    resetReleasesFilter2(data) {
      this.releasesFilter = {
        youtube: false,
        youtube2: false,
        discogs: false,
        various: false,
        onRevibed: false,
        goodReleases: false
      }
    },
    resetReleasesFilter3(data) {
      this.releasesFilter.addToRVBD = false
      this.releasesFilter.goodReleases = false

      let index = this.filterState.indexOf('goodReleases')
      console.log('index ', index)
      if (index !== -1) {
        this.filterState.splice(index, 1)
      }
      let index2 = this.filterState.indexOf('addToRVBD')
      console.log('index2 ', index2)
      if (index2 !== -1) {
        this.filterState.splice(index2, 1)
      }
    },
    setReleasesFilter(data) {
      console.log('setReleasesFilter ', data)
      this.releasesFilter[data.item] = data.value
      console.log('releasesFilter ', this.releasesFilter)
    },
    //// export functions
    async exportReleasesToRVBD(releases) {
      this.setLoading({ state: true })
      let releases2 = releases.map((item) => {
        let releaseData = this.releases.find((el) => el._id === item)
        return releaseData
      })
      const releasesParced = JSON.parse(JSON.stringify(releases2))
      const response = await window.mainApi.invoke('getReleaseForRVBD', {
        releases: releasesParced
      })
      console.log('exportReleasesToRVBD response: ', response)
      this.setLoading({
        state: false,
        finish: true,
        message: { title: 'Archives for upload is ready', body: 'You can start upload' }
      })
    },
    async exportReleasesToYoutube(releases) {
      this.setLoading({ state: true })
      let releases2 = releases.map((item) => {
        let releaseData = this.releases.find((el) => el._id === item)
        return releaseData
      })
      const releasesParced = JSON.parse(JSON.stringify(releases2))

      const response = await window.mainApi.invoke('getReleaseForYoutube', {
        releases: releasesParced
      })
      console.log('exportReleasesToYoutube response: ', response)
      this.setLoading({
        state: false,
        finish: true,
        message: {
          title: 'Export of releases to Youtube is complete',
          body: 'You can start upload'
        }
      })
    }
  },
  getters: {
    getAllReleases: (state) => {
      return state.allReleases
    },
    getReleases: (state) => {
      //console.log('getReleases store', state.releases)
      let filters = [...state.filterState]
      console.log('getReleases filters ', filters)
      if (filters.length) {
        if (filters.indexOf('goodReleases') > -1) {
          return state.releases.filter(
            (item) =>
              item.statusYoutube === 'review' &&
              item.statusArtist !== 'warning' &&
              item.statusArtist !== 'blocked' &&
              item.statusDiscogs !== 'warning' &&
              item.statusDiscogs !== 'blocked' &&
              item.status !== 'warning' &&
              item.status !== 'blocked' &&
              item.statusVarious !== 'various'
          )
        } else if (filters.indexOf('addToRVBD') > -1) {
          return state.releases.filter(
            (item) =>
              item.statusYoutube === 'review' &&
              item.statusArtist !== 'warning' &&
              item.statusArtist !== 'blocked' &&
              item.statusDiscogs !== 'warning' &&
              item.statusDiscogs !== 'blocked' &&
              item.statusVarious !== 'various' &&
              item.status !== 'warning' &&
              item.status !== 'blocked' &&
              !item.onRevibed.forSale &&
              !item.onRevibed.id
          )
        } else {
          let preResult
          let indexOnRevibed = filters.indexOf('onRevibed')
          if (indexOnRevibed > -1) {
            filters.splice(indexOnRevibed, 1)
            preResult = state.releases.filter((item) => item.onRevibed.forSale)
          } else {
            preResult = state.releases
          }
          let findSource = filters.find((item) => item.source)
          let sourceData
          if (findSource) {
            sourceData = findSource.source
            filters = filters.map((item) => {
              if (item.source) {
                item = 'source'
              }
              return item
            })
          }
          let filterQuerys = {
            youtube: (item) => item.statusYoutube === 'warning',
            youtube2: (item) => item.statusYoutube === 'notUploaded',
            discogs: (item) => item.statusDiscogs === 'warning' || item.statusDiscogs === 'blocked',
            various: (item) => item.statusVarious === 'various',
            onRevibed: (item) => item.onRevibed.forSale,
            source: (item) => item.source === sourceData
          }
          if (filters.length) {
            let conditions = []
            for (let filter of filters) {
              conditions.push(filterQuerys[filter])
            }
            console.log('conditions ', conditions)
            let result = preResult.filter((d) => conditions.some((c) => c(d)))
            return result
          } else {
            return preResult
          }
        }
      } else {
        console.log('no filter')
        return state.releases
      }
    },
    getStorageFolder: (state) => {
      return state.storageFolder
    },
    getReleaseOne: (state) => (id) => {
      // console.log('getReleaseOne ', state.releases)
      const releases = toRaw(state.releases)
      const storageFolder = toRaw(state.storageFolder)
      const release = releases.find((item) => item.releaseID === +id)

      if (release) {
        const localPath = `${storageFolder}/${release.releaseID}`
        release.localPath = localPath
        console.log('storageFolder localPath', localPath)
        return release
      }
    },
    getReleaseTracks: (state) => (id) => {
      console.log('getReleaseTracks ', id)
      if (state.tracks.length) {
        return state.tracks.filter((item) => item.releaseID === id).reverse()
      }
    },
    getFilesPath: (state) => {
      return state.filesPath
    },
    getFolderPath: (state) => {
      return state.folderPath
    },
    getFolderFilesReadyState: (state) => {
      return state.folderFilesReady
    },
    getFolderDroppedState: (state) => {
      return state.folderDropped
    },
    getFolderDroppedData: (state) => {
      return state.folderDroppedData
    },
    getLoading: (state) => {
      return state.loading
    },
    allDataInStore: (state) => {
      return state.allDataInStore
    },
    getSelectedFilterTags: (state) => (id) => {
      return state.selectedTagsForFilter[id]
    },
    getSelectedTrackItem: (state) => {
      return state.selectedTrack
    },
    getIfprojectExists: (state) => (id) => {
      const findRelease = state.allReleases.find((item) => item.releaseID === +id)
      console.log('getIfprojectExists ', findRelease)
      if (findRelease) {
        return { exist: true, type: findRelease.type }
      } else {
        return { exist: false }
      }
    },
    getOnYoutubeCount(state) {
      return state.onYoutubeCount
    },
    getOnRevibedCount(state) {
      return state.onRevibedCount
    },
    //// Filter
    getFilterState(state) {
      return state.filterState
    },
    getReleasesFilter(state) {
      console.log('getReleasesFilter ', state.releasesFilter)
      return state.releasesFilter
    }
  }
})
import soundFinish from '../assets/sound/finish2.mp3'

function showNotification(message) {
  console.log('showNotification ', message)
  new Notification(message.title, {
    body: message.body,
    icon: 'icon.png',
    silent: true // notification is silent - no sounds or vibrations issued
  })
  new Audio(soundFinish).play()
}

function removeDublikatesAndCount(original) {
  const compressed = []
  // make a copy of the input array
  const copy = original.slice(0)
  // first loop goes over every element
  for (let i = 0; i < original.length; i++) {
    let myCount = 0
    // loop over every element in the copy and see if it's the same
    for (let w = 0; w < copy.length; w++) {
      if (original[i] == copy[w]) {
        // increase amount of times duplicate is found
        myCount++
        // sets item to undefined
        delete copy[w]
      }
    }
    if (myCount > 0) {
      const a = new Object()
      a.name = original[i]
      a.count = myCount
      compressed.push(a)
    }
  }
  return compressed
}
