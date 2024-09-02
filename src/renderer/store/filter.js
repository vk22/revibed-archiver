import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3000'
//const API_URL = 'http://labels.kx-streams.com/api';

export const useFilterStore = defineStore('filter', {
  state: {
    allLabels: [],
    allReleases: [],
    releases: [],
    sortedLabels: [],
    youtubes: [],
    onYoutubeCount: 0,
    onRevibedCount: 0,
    ytbDistributors: [],
    distributors: [],
    owners: [],
    artists: [],
    countries: [],
    allDataReady: false,
    filterState: [],
    releasesAdded: [],
    releasesAllStatuses: ['default', 'warning', 'blocked', 'success'],
    labelsAllStatuses: {
      contact: [
        'not_contacted',
        'contacted',
        'refused',
        'approved',
        'open_to_talk',
        'in_negotiation',
        'no_contact_available',
        'more_info_needed',
        'email_bounced',
        'reconnect_later'
      ],
      main: ['default', 'warning', 'blocked', 'success'],
      youtube: ['default', 'warning']
    },
    labelFilterStatusContact: 'All',
    labelFilterStatusMain: 'All',
    labelFilterStatusYoutube: 'All',
    labelFilterStatusHasContacts: false,
    labelsFiltersDefault: ['All', 'All', 'All', false, undefined],
    labelsFilters: ['All', 'All', 'All', false, undefined],
    artistsAllStatuses: {
      contact: [
        'not_contacted',
        'contacted',
        'refused',
        'approved',
        'open_to_talk',
        'in_negotiation',
        'no_contact_available',
        'more_info_needed',
        'email_bounced',
        'reconnect_later'
      ],
      main: ['default', 'warning', 'blocked', 'success'],
      youtube: ['default', 'warning']
    },
    releasesFilter: {
      youtube: false,
      youtube2: false,
      discogs: false,
      various: false,
      onRevibed: false,
      goodReleases: false,
      addToRVBD: false
    },
    tableState: {
      releases: {
        sortBy: [{ key: 'updated', order: 'desc' }],
        pageNum: 1
      },
      labels: {
        sortBy: [{ key: 'count', order: 'desc' }],
        pageNum: 1
      }
    }
  },
  actions: {
    // makeBackup({commit}) {
    //     commit('backupState')
    // },
    async getYoutubes() {
      const response = await axios.get(`${API_URL}/get-youtubes`)
      return response
    },
    async getLabels() {
      const response = await axios.get(`${API_URL}/get-labels`)
      return response
    },
    async getArtists() {
      const response = await axios.get(`${API_URL}/get-artists`)
      return response
    },
    async getReleases() {
      const response = await axios.get(`${API_URL}/get-releases`, {
        headers: {
          'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
        }
      })
      return response
    },
    async getDistributors() {
      const response = await axios.get(`${API_URL}/get-distributors`)
      return response
    },
    async getOwners() {
      const response = await axios.get(`${API_URL}/get-owners`)
      return response
    },
    async getAllData({ state, dispatch, commit }) {
      console.time('getAllData')
      state.allDataReady = false

      //// Parallel
      const [getYoutubesData, getLabelsData, getArtistsData] = await Promise.all([
        dispatch('getYoutubes'),
        dispatch('getLabels'),
        dispatch('getArtists')
      ])
      console.log('getYoutubes ', getYoutubesData.data)
      console.log('getLabels ', getLabelsData.data)
      if (getYoutubesData.data.success) {
        commit('setYoutubes', getYoutubesData.data)
      }
      if (getLabelsData.data.success) {
        commit('setLabels', getLabelsData.data)
      }
      if (getArtistsData.data.success) {
        commit('setArtists', getArtistsData.data)
      }

      const getReleasesData = await dispatch('getReleases')
      console.log('getReleases response ', getReleasesData.data)
      if (getReleasesData.data.success) {
        commit('setReleases', getReleasesData.data)
      }

      const getDistributorsData = await dispatch('getDistributors')
      console.log('getDistributors response ', getDistributorsData.data)
      if (getDistributorsData.data.success) {
        commit('setDistributors', getDistributorsData.data)
      }

      const getOwnersData = await dispatch('getOwners')
      console.log('getOwners response ', getOwnersData.data)
      if (getOwnersData.data.success) {
        commit('setOwners', getOwnersData.data)
      }

      state.allDataReady = true
      console.timeEnd('getAllData')
    },
    // async getLabels({ state, commit }) {
    //     const { data } = await axios.get(`${API_URL}/get-labels`);
    //     console.log("getLabels response ", data);
    //     if (data.success) {
    //         commit('setLabels', data)
    //     }
    // },
    async addLabel({ state, dispatch }, labelData) {
      state.allDataReady = false
      console.log('labelData ', labelData)
      let label = {
        name: labelData.label.name
      }
      let type = labelData.type

      if (label) {
        if (type === 'labels') {
          const { data } = await axios.post(
            `${API_URL}/add-label/`,
            { label: label },
            {
              headers: {
                'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
              }
            }
          )
          console.log('response after edit: ', data)
        } else if (type === 'distributors') {
          const { data } = await axios.post(`${API_URL}/add-distributor/`, { label: label })
          console.log('response after edit: ', data)
        } else if (type === 'owners') {
          const { data } = await axios.post(`${API_URL}/add-owner/`, { label: label })
          console.log('response after edit: ', data)
        }
      }
      await dispatch('getAllData')
    },
    async editLabel({ state, dispatch }, labelData) {
      state.allDataReady = false
      console.log('labelData ', labelData)
      let label = {
        name: labelData.label.name,
        id: labelData.label.id,
        contacts: labelData.label.contacts,
        status: labelData.label.status,
        statusContact: labelData.label.statusContact,
        parent_label: labelData.label.parent_label ? labelData.label.parent_label : null
      }
      let labelID = labelData.label._id
      let type = labelData.type
      console.log('labelID ', labelID)
      console.log('label ', label)

      if (label) {
        if (type === 'labels') {
          const { data } = await axios.put(`${API_URL}/edit-label/${labelID}`, { label: label })
          console.log('response after edit: ', data)
        } else if (type === 'distributors') {
          const { data } = await axios.put(`${API_URL}/edit-distributor/${labelID}`, {
            label: label
          })
          console.log('response after edit: ', data)
        } else if (type === 'owners') {
          const { data } = await axios.put(`${API_URL}/edit-owner/${labelID}`, { label: label })
          console.log('response after edit: ', data)
        }
      }
      await dispatch('getAllData')
    },
    async editArtist({ state, dispatch }, artistData) {
      state.allDataReady = false
      console.log('artistData ', artistData)
      let artist = {
        name: artistData.artist.name,
        id: artistData.artist.id,
        contacts: artistData.artist.contacts,
        status: artistData.artist.status,
        statusContact: artistData.artist.statusContact
      }
      let artistID = artistData.artist._id
      let type = artistData.type
      console.log('artistID ', artistID)
      console.log('artist ', artist)

      if (artist) {
        if (type === 'artists') {
          const { data } = await axios.put(`${API_URL}/edit-artist/${artistID}`, { artist: artist })
          console.log('response after edit: ', data)
        }
      }
      await dispatch('getAllData')
    },

    async removeParentLabel({ state, dispatch }, labelData) {
      state.allDataReady = false
      console.log('labelData ', labelData)
      let label = {
        name: labelData.label.name,
        id: labelData.label.id,
        contacts: labelData.label.contacts,
        status: labelData.label.status,
        statusContact: labelData.label.statusContact,
        parent_label: labelData.label.parent_label
      }
      let labelID = labelData.label._id
      let type = labelData.type
      console.log('labelID ', labelID)
      console.log('label ', label)

      if (label) {
        if (type === 'labels') {
          const { data } = await axios.put(`${API_URL}/remove-parentlabel/${labelID}`, {
            label: label
          })
          console.log('response after edit: ', data)
        } else if (type === 'distributors') {
          const { data } = await axios.put(`${API_URL}/edit-distributor/${labelID}`, {
            label: label
          })
          console.log('response after edit: ', data)
        } else if (type === 'owners') {
          const { data } = await axios.put(`${API_URL}/edit-owner/${labelID}`, { label: label })
          console.log('response after edit: ', data)
        }
      }
      await dispatch('getAllData')
    },
    async exportLabels({ state, commit }, labels) {
      console.log('exportLabels ', labels)
      const { data } = await axios.post(
        'http://labels.kx-streams.com/api/export-labels/',
        { labels: labels },
        { responseType: 'arraybuffer' }
      )
      console.log('exportLabels response: ', data)
      forceFileDownload(data, 'export-labels.csv')
    },
    async exportReleases({ state, commit }, releases) {
      console.log('exportReleases ', releases)
      const { data } = await axios.post(
        `${API_URL}/export-releases/`,
        { releases: releases },
        { responseType: 'arraybuffer' }
      )
      console.log('exportReleases response: ', data)
      forceFileDownload(data, 'export-releases.csv')
    },
    async removeFromRevibedMany({ state, commit }, releases) {
      console.log('removeFromRevibedMany ', releases)
      const { data } = await axios.post(`${API_URL}/remove-from-rvbd-many/`, { releases: releases })
      console.log('removeFromRevibedMany response: ', data)
    },

    async editRelease({ state, dispatch }, releaseData) {
      console.log('releaseData ', releaseData)

      let release = releaseData.release

      console.log('editRelease ', release)
      if (release) {
        const { data } = await axios.put(`${API_URL}/edit-release/${release._id}`, {
          release: release
        })
        console.log('response after edit: ', data)
      }
      await dispatch('getAllData')
    },
    async deleteRelease({ state, commit }, releaseData) {
      console.log('releaseData ', releaseData)

      let release = {
        id: releaseData.release._id
      }
      console.log('deleteRelease ', release)
      if (release) {
        const { data } = await axios.delete(`${API_URL}/delete-release/${release.id}`, {
          headers: {
            'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
          }
        })
        console.log('response after delete: ', data)
      }
    },
    async editYoutube({ state, dispatch }, youtubeData) {
      console.log('youtubeData ', youtubeData)
      let youtube = {
        discogsRelease: youtubeData.youtube.discogsRelease,
        id: youtubeData.youtube._id
      }
      console.log('editYoutube ', youtube)
      if (youtube) {
        const { data } = await axios.put(`${API_URL}/edit-youtube/${youtube.id}`, {
          youtube: youtube
        })
        console.log('response after edit: ', data)
      }
      await dispatch('getAllData')
    },
    async editDistributor({ state, dispatch }, labelData) {
      let contacts = labelData.label.contacts
      let status = labelData.status
      let labelID = labelData.label._id

      if (labelData) {
        const { data } = await axios.put(`${API_URL}/edit-distributor/${labelID}`, {
          contacts: contacts,
          status: status
        })
        console.log('response after edit: ', data)
      }
      await dispatch('getAllData')
    },
    async editOwner({ state, dispatch }, labelData) {
      let contacts = labelData.label.contacts
      let status = labelData.status
      let labelID = labelData.label._id

      if (labelData) {
        const { data } = await axios.put(`${API_URL}/edit-owner/${labelID}`, {
          contacts: contacts,
          status: status
        })
        console.log('response after edit: ', data)
      }
      await dispatch('getAllData')
    }
  },
  mutations: {
    setYoutubes(state, data) {
      state.youtubes = data.youtubes
    },
    setDistributors(state, data) {
      state.distributors = data.distributors
      console.time('setDistributors')
      state.distributors.map((distributor) => {
        distributor.releases = []
        distributor.count = 0
        for (let release of state.releases) {
          if (release.youtubeCopyrightOwners.length) {
            for (let row of release.youtubeCopyrightOwners) {
              if (row.distributor.length) {
                for (let item of row.distributor) {
                  if (item === distributor.name) {
                    distributor.releases.push(release)
                    distributor.count += 1
                    release.statusDistributor = distributor.statusContact
                  }
                }
              }
            }
          }
        }
        return distributor
      })

      state.distributors.sort((a, b) => {
        return b.count - a.count
      })

      console.timeEnd('setDistributors')
    },
    setOwners(state, data) {
      state.owners = data.owners
      console.time('setOwners')
      state.owners.map((owner) => {
        owner.releases = []
        owner.count = 0
        for (let release of state.releases) {
          if (release.youtubeCopyrightOwners.length) {
            for (let row of release.youtubeCopyrightOwners) {
              if (row.label.length) {
                for (let item of row.label) {
                  if (item === owner.name) {
                    owner.releases.push(release)
                    owner.count += 1
                    release.statusOwner = owner.statusContact
                  }
                }
              }
            }
          }
        }
        return owner
      })

      state.owners.sort((a, b) => {
        return b.count - a.count
      })
      console.timeEnd('setOwners')
    },
    setLabels(state, data) {
      console.time('setLabels')
      state.allLabels = [...data.labels]

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
      state.releasesAdded = releasesAdded
      labelsSorted.sort((a, b) => b.count - a.count)
      state.sortedLabels = labelsSorted
      console.timeEnd('setLabels')
    },
    setReleases(state, data) {
      console.time('setReleases')
      let notFound = []
      let countries = []

      for (let release of data.releases) {
        /// add statusDiscogs --- Переносим на релизы статусы леблов
        if (release.labelParentID) {
          let labelParent = state.sortedLabels.find((item) => item.id === release.labelParentID)
          if (labelParent) {
            release.statusDiscogs = labelParent.status
            release.labelParent = labelParent
          }
        } else {
          let label = state.sortedLabels.find((item) => item.id === release.labelID)
          if (label) {
            release.statusDiscogs = label.status
          }
        }

        //// statusArtist
        if (release.artists[0]) {
          let artist = state.artists.find((item) => item.id === release.artists[0].id)
          if (artist) {
            release.statusArtist = artist.status
          }
        }
        /// onRevibed count
        if (release.onRevibed) {
          state.onRevibedCount += 1
        }

        /// youtubeLink, onYoutubeCount
        // let youtube = state.youtubes.find(el => el.discogsRelease === release.releaseID)
        // if (youtube) {
        //     release.youtubeLink = `https://www.youtube.com/watch?v=${youtube.videoId}`
        //     state.onYoutubeCount += 1
        // }
        if (release.youtubeVideoID) {
          state.onYoutubeCount += 1
        }

        /// add statusYoutube --- youtubeCopyrightOwners handle
        if (release.youtubeCopyrightOwners.length) {
          release.youtubeCopyrightOwnersDistributor = []
          release.youtubeCopyrightOwnersLabel = []
          for (let row of release.youtubeCopyrightOwners) {
            if (row.distributor.length) {
              for (let item of row.distributor) {
                release.youtubeCopyrightOwnersDistributor.push(item)
              }
              // sortYtbDistributors(release, row.distributor)
            }

            if (row.label.length) {
              for (let item of row.label) {
                release.youtubeCopyrightOwnersLabel.push(item)
              }
            }
          }
          release.youtubeCopyrightOwnersDistributor =
            release.youtubeCopyrightOwnersDistributor.join(', ')
          release.youtubeCopyrightOwnersLabel = release.youtubeCopyrightOwnersLabel.join(', ')
          release.statusYoutube = 'warning'
          //// Переносим статусы на лейблы
          if (release.labelID) {
            let findReleaselabel = state.sortedLabels.find((item) => item.id === release.labelID)
            findReleaselabel.statusYoutube = release.statusYoutube
          }
          if (release.labelParentID) {
            let findReleaselabel = state.sortedLabels.find(
              (item) => item.id === release.labelParentID
            )
            findReleaselabel.statusYoutube = release.statusYoutube
          }
        } else {
          if (release.youtubeVideoID) {
            release.statusYoutube = 'review'
          } else {
            release.statusYoutube = 'notUploaded'
          }
        }

        //// add statusVarious
        if (release.artist.indexOf('Various') > -1) {
          release.statusVarious = 'various'
        } else {
          release.statusVarious = ''
        }

        if (!release.comment) {
          release.comment = ''
        }

        //// Set Countries
        if (release.country) {
          countries.push(release.country)
        }
      }
      // sortedLabels.sort((a, b) => {
      //   return b.count - a.count;
      // });

      countries = removeDublikatesAndCount(countries)
      countries.sort(function (a, b) {
        return b.count - a.count
      })
      state.countries = countries
      //console.log('countries ', countries)

      console.timeEnd('setReleases')
      // console.log('notFound ', notFound)

      // state.sortedLabels = data.sortedLabels
      state.allReleases = data.releases
      state.releases = data.releases

      console.log('data.releases.length ', data.releases.length)
      console.log('state.releasesAdded.length ', state.releasesAdded.length)

      // data.releases.map( item => {
      //     let findIndex = state.releasesAdded.findIndex( el => el === item.releaseID)
      //     // console.log('findIndex ', findIndex)
      //     if (findIndex === -1) {
      //         console.log('not found ', item)
      //     }
      // })
    },
    setArtists(state, data) {
      data.artists.sort((a, b) => {
        return b.releases.length - a.releases.length
      })
      state.artists = data.artists
    },
    setFilteredState(state, data) {
      console.log('setFilteredState ', data)
      state.filterState = data
    },
    setTableState(state, data) {
      /// name, type, value
      console.log('setTableState ', data)
      state.tableState[data.name][data.type] = data.value
    },
    setFilteredState2(state, data) {
      console.log('setFilteredState2 ', data)
      if (data.action === 'add') {
        if (data.value === 'goodReleases' || data.value === 'addToRVBD') {
          state.filterState = []
        }
        state.filterState.push(data.value)
      } else if (data.action === 'remove') {
        let index = state.filterState.indexOf(data.value)
        console.log('index ', index)
        if (index !== -1) {
          state.filterState.splice(index, 1)
        }
      }
    },
    resetReleasesFilter1(state, data) {
      state.releasesFilter = {
        youtube: false,
        youtube2: false,
        discogs: false,
        various: false,
        onRevibed: false,
        addToRVBD: false
      }
    },
    resetReleasesFilter2(state, data) {
      state.releasesFilter = {
        youtube: false,
        youtube2: false,
        discogs: false,
        various: false,
        onRevibed: false,
        goodReleases: false
      }
    },
    resetReleasesFilter3(state, data) {
      state.releasesFilter.addToRVBD = false
      state.releasesFilter.goodReleases = false

      let index = state.filterState.indexOf('goodReleases')
      console.log('index ', index)
      if (index !== -1) {
        state.filterState.splice(index, 1)
      }
      let index2 = state.filterState.indexOf('addToRVBD')
      console.log('index2 ', index2)
      if (index2 !== -1) {
        state.filterState.splice(index2, 1)
      }
    },
    setReleasesFilter(state, data) {
      console.log('setReleasesFilter ', data)
      state.releasesFilter[data.item] = data.value
      console.log('state.releasesFilter ', state.releasesFilter)
    },
    setLabelsFilters(state, data) {
      console.log('setLabelsFilters ', data)
      state.labelFilterStatusContact = data[0]
      state.labelFilterStatusMain = data[1]
      state.labelFilterStatusYoutube = data[2]
      state.labelFilterStatusHasContacts = data[3]
      state.labelsFilters = data
    }
  },
  getters: {
    getAllDataReady(state) {
      return state.allDataReady
    },
    getAllLabelsList(state) {
      return state.allLabels.map((item) => {
        return {
          id: item.id,
          name: item.name
        }
      })
    },
    getLabelsList: (state) => (labelsType) => {
      let query = state.labelsFilters
      // let labelsType = query[query.length-1]
      // query.pop();
      let filters = [...query]
      let conditions = []
      console.log('filters ', filters)
      console.log('labelsType ', labelsType)
      filters.map((item, index) => {
        if (index == 0) {
          if (item !== 'All') {
            conditions.push((el) => el.statusContact === item)
          }
        }
        if (index == 1) {
          if (item !== 'All') {
            conditions.push((el) => el.status === item)
          }
        }
        if (index == 2) {
          if (item !== 'All') {
            conditions.push((el) => el.statusYoutube === item)
          }
        }
        if (index == 3) {
          if (item) {
            conditions.push((el) => el.contacts[0])
          }
        }
      })
      let labelsSource
      if (labelsType === 'labels') {
        labelsSource = [...state.sortedLabels.filter((item) => item.count)]
      } else if (labelsType === 'distributors') {
        labelsSource = [...state.distributors]
      } else if (labelsType === 'owners') {
        labelsSource = [...state.owners]
      }

      if (conditions.length) {
        let result = labelsSource.filter((d) => conditions.every((c) => c(d)))
        return result
      } else {
        return labelsSource
      }

      // if (state.sortedLabels.length) {
      //     let result = state.sortedLabels
      //     return result
      // }
    },
    getLabel: (state) => (id) => {
      if (state.releases.length) {
        let label = state.sortedLabels.find((item) => item.id === +id)

        label.subreleases = label.subreleases.map((subr) => {
          let release = state.releases.find((rel) => rel.releaseID === subr)
          if (release) {
            return release
          } else {
            return subr
          }
        })
        label.releases = label.releases.map((subr) => {
          let release = state.releases.find((rel) => rel.releaseID === subr)
          if (release) {
            return release
          } else {
            return subr
          }
        })
        return label
      }
    },
    getAllReleases(state) {
      return state.allReleases
    },
    getReleases: (state) => (mode) => {
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
              !item.onRevibed
          )
        } else {
          let preResult
          let indexOnRevibed = filters.indexOf('onRevibed')
          if (indexOnRevibed > -1) {
            filters.splice(indexOnRevibed, 1)
            preResult = state.releases.filter((item) => item.onRevibed)
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
            onRevibed: (item) => item.onRevibed,
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
    getRelease: (state) => (id) => {
      if (state.releases.length) {
        return state.releases.find((item) => item._id === id)
      }
    },
    getYoutube: (state) => (id) => {
      if (state.youtubes.length) {
        return state.youtubes.find((item) => item.videoId === id)
      }
    },
    getOnYoutubeCount(state) {
      return state.onYoutubeCount
    },
    getOnRevibedCount(state) {
      return state.onRevibedCount
    },
    getYoutubes(state) {
      return state.youtubes
    },
    getDistributors(state) {
      return state.distributors
    },
    getDistributor: (state) => (id) => {
      if (state.distributors.length) {
        return state.distributors.find((item) => item.id === +id)
      }
    },
    getOwners(state) {
      return state.owners
    },
    getOwner: (state) => (id) => {
      if (state.owners.length) {
        console.log('getOwner ', id)
        return state.owners.find((item) => item.id === +id)
      }
    },
    getCountriesList(state) {
      return state.countries
    },
    getArtistsList(state) {
      console.log('state.artists ', state.artists)
      return state.artists
    },
    getArtist: (state) => (id) => {
      if (state.artists.length) {
        console.log('getOwner ', id)
        let artist = state.artists.find((item) => item.id === +id)

        artist.releases = artist.releases.map((item) => {
          let release = state.releases.find((rel) => rel.releaseID === item)
          if (release) {
            return release
          } else {
            return item
          }
        })

        return artist
      }
    },
    getCountry: (state) => (id) => {
      if (state.countries.length) {
        let country = state.countries.find((item) => item.name === id)
        country.releases = state.releases.filter((item) => item.country === id)
        return country
      }
    },
    getAllLabelsStatuses: (state) => (type, isFilter) => {
      let labels = [...state.labelsAllStatuses[type]]
      if (isFilter) {
        labels.unshift('All')
      }
      // console.log('getAllLabelsStatuses ', labels)
      return labels
    },
    getAllArtistsStatuses: (state) => (type, isFilter) => {
      let artists = [...state.artistsAllStatuses[type]]
      if (isFilter) {
        artists.unshift('All')
      }
      // console.log('getAllLabelsStatuses ', labels)
      return artists
    },
    getLabelFilterStatusContact(state) {
      return state.labelFilterStatusContact
    },
    getAllReleasesStatuses(state) {
      return state.releasesAllStatuses
    },
    getLabelFilterStatusMain(state) {
      return state.labelFilterStatusMain
    },
    getLabelFilterStatusHasContacts(state) {
      return state.labelFilterStatusHasContacts
    },
    getLabelFilterStatusYoutube(state) {
      return state.labelFilterStatusYoutube
    },
    getFilterState(state) {
      return state.filterState
    },
    getTableState: (state) => (data) => {
      /// data: { name, type }
      console.log('getTableState ', state.tableState)
      if (data.name) {
        return state.tableState[data.name][data.type]
      }
    },
    getFilterStateLabels(state) {
      let result = false
      state.labelsFilters.forEach((el, i) => {
        if (el !== state.labelsFiltersDefault[i]) {
          result = true
        }
      })
      return result
    },
    getReleasesFilter(state) {
      console.log('getReleasesFilter ', state.releasesFilter)
      return state.releasesFilter
    }
  },
  modules: {}
  // plugins: [createPersistedState()]
})

function forceFileDownload(response, title) {
  console.log(title)
  const url = window.URL.createObjectURL(new Blob([response]))
  console.log('url ', url)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', title)
  document.body.appendChild(link)
  link.click()
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
