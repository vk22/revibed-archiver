import { defineStore } from 'pinia'
import { useMainStore } from './main'
import MRecommendations from '@/renderer/services/musicRecommends.js'
const musicRecommendations = new MRecommendations()

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlistPanelIsOpen: false,
    playlist: [],
    initPlayState: false,
    loading: false,
    playingIndex: null,
    playing: false,
    playingFile: {},
    selectedTrack: undefined,
    onPause: false,
    source: undefined,
    skipToState: false,
    // playerIsActive: false
  }),

  actions: {
    // async nuxtServerInit ({ commit, dispatch }, { req }) {
    //   await dispatch('getTracks')
    // },
    // setPlayerActive({ commit }, data) {
    //   commit('setPlayerActive2', data)
    // }

    stopAndClearPlay(state) {
      this.playlist = []
      this.initPlayState = false
      this.playingIndex = null
      this.playing = false
      this.playingFile = undefined
      this.selectedTrack = undefined
      this.onPause = false
      this.source = undefined
      this.playerIsActive = false
    },
    setPlaylist(playlist) {
      console.log('setPlaylist ', playlist)
      this.playlist = playlist.tracks
      this.source = playlist.source
    },
    play(data) {
      console.log('mutations play ', data)
      this.playingIndex = data.index
      this.playingFile = {
        filename: data.filename,
        releaseID: data.releaseID
      }
      this.initPlayState = true
      this.loading = true
    },
    pause(index) {
      console.log('mutations pause ', index)
      this.playingIndex = index
      this.onPause = true
    },
    stop() {
      console.log('mutations stop ')
      this.playingIndex = null
      this.initPlayState = false
    },
    skipTo(index) {
      console.log('jumpTo ', index)
      this.playingIndex = index
      this.initSkip(true);
    },
    initPlay(play) {
      // console.log('initPlay ', this.initPlay, play)
      this.initPlayState = play
    },
    initSkip(data) {
      this.skipToState = data
    },
    setPlayingIndex(data) {
      console.log('mutations setPlayingIndex ', data)
      this.playingIndex = data.index
      this.playingFile = {
        filename: data.filename,
        releaseID: data.releaseID
      }
    },
    setSelectedTrack(track) {
      console.log('setSelectedTrack ', track)
      this.selectedTrack = track
      // this.findSimilar(track)
    },
    setPlaying(playing) {
      this.playing = playing
      this.onPause = false
      this.loading = false
    },
    async startRadio(track) {
      const storeMain = useMainStore()
      storeMain.setLoading({ state: true })
      await musicRecommendations.loadDB()

      console.log('startRadio ', track)
      // track.id = `${track.title}.flac`
      const firstTrack = await musicRecommendations.getTarget(track)
      // console.log('firstTrack ', firstTrack)
      if (!firstTrack) {
        storeMain.setLoading({ state: false })
        alert('no track found')
        return false
      }
      this.setSelectedTrack({
        title: firstTrack.title,
        artist: firstTrack.artist,
        path: firstTrack.path,
        howl: null,
        display: true
      })

      const radioPlaylist = await this.createRecommentationsPlaylist(firstTrack, 100)
      this.setPlaylist(radioPlaylist)

      this.play({
        index: 0,
        filename: track.title,
        releaseID: track.releaseID
      })
      storeMain.setLoading({ state: false })
    },
    async createRecommentationsPlaylist(track, count) {
      //console.log('createRecommentationsPlaylist ', track)
      const playlist = {
        source: 'radio',
        tracks: []
      }
      let n = 0
      let currentTrack = track
      playlist.tracks.push({
        releaseID: track.releaseID,
        id: track.id,
        title: track.meta.title,
        artist: track.meta.artist,
        duration: track.meta.duration,
        path: track.path,
        howl: null,
        display: true
      })
      while (n < count) {
        n++
        const results = await musicRecommendations.findSimilar(currentTrack, 1)
        if (!results.length) continue
        currentTrack = results[0].track
        //console.log('currentTrack ', currentTrack)
        playlist.tracks.push({
          releaseID: currentTrack.releaseID,
          id: currentTrack.id,
          title: currentTrack.meta.title,
          artist: currentTrack.meta.artist,
          duration: currentTrack.meta.duration,
          path: currentTrack.path,
          howl: null,
          display: true
        })
      }

      return playlist
    },
    async findSimilar(track) {
      const results = await musicRecommendations.findSimilar(track, 5)
      console.log('results ', results)
    },
    setPlaylistPanelIsOpen() {
      this.playlistPanelIsOpen = !this.playlistPanelIsOpen
    }
  },

  getters: {
    getPlaylist(state) {
      return state.playlist
    },
    getPlaylistSource(state) {
      return state.source
    },
    getPlayingIndex(state) {
      return state.playingIndex
    },
    getSelectedTrack(state) {
      return state.selectedTrack
    }
  }
})
