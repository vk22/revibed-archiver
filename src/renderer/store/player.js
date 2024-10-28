
import { defineStore } from 'pinia'


export const usePlayerStore = defineStore('player', {

  state: () => ({
    playlist: [],
    initPlay: false,
    loading: false,
    playingIndex: null,
    playing: false,
    playingFile: {},
    selectedTrack: undefined,
    onPause: false,
    source: undefined,
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
      this.initPlay = false
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
        projectID: data.projectID
      }
      this.initPlay = true
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
      this.initPlay = false
    },
    initPlay(play) {
      // console.log('initPlay ', this.initPlay, play)
      this.initPlay = play
    },
    setPlayingIndex(data) {
      console.log('mutations setPlayingIndex ', data)
      this.playingIndex = data.index
      this.playingFile = {
        filename: data.filename,
        projectID: data.projectID
      }
    },
    setSelectedTrack(track) {
      console.log('setSelectedTrack ', track)
      this.selectedTrack = track
    },
    setPlaying(playing) {
      this.playing = playing
      this.onPause = false
      this.loading = false
    },
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


