<template>
  <div>
    <!-- <player-title-bar></player-title-bar>
        <player-info-panel
        :trackInfo="getTrackInfo">
        </player-info-panel> -->
    <player-controls-bars
      :loop="loop"
      :shuffle="shuffle"
      :progress="progress"
      :playing="playing"
      :trackInfo="getTrackInfo"
      :waitingMusic="waitingMusic"
      :playerIsActive="playerIsActive"
      @playtrack="play"
      @pausetrack="pause"
      @stoptrack="stop"
      @skiptrack="skip"
      @toggleloop="toggleLoop"
      @toggleshuffle="toggleShuffle"
      @updateseek="setSeek"
    >
    </player-controls-bars>
    <!-- <player-playlist-panel
        :playlist="playlist"
        :selectedTrack="selectedTrack"
        @selecttrack="selectTrack"
        @playtrack="play">
        </player-playlist-panel>
        <player-search-bar
        :playlist="playlist">
        </player-search-bar> -->
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Howl, Howler } from 'howler'
import PlayerControlsBars from './PlayerControlsBars.vue'
import { usePlayerStore } from '@/renderer/store/player'
import { useMainStore } from '@/renderer/store/main'
const store = usePlayerStore()
const storeMain = useMainStore()

const playlist = ref([])
const playerIndex = ref(0)
const playing = ref(false)
const loop = ref(false)
const shuffle = ref(false)
const seek = ref(0)
const waitingMusic = ref(false)
const playerIsActive = ref(false)
const currentTrack = ref(null)
const source = ref(undefined)
const player = ref(undefined)

const selectedTrack = computed(() => {
  return store.selectedTrack
})

const progress = computed(() => {
  if (currentTrack.value) {
    if (currentTrack.value.howl.duration === 0) return 0
    // console.log('progress ', seek.value / currentTrack.value.howl.duration())
    return seek.value / currentTrack.value.howl.duration()
  } else {
    return 0
  }
})

const getTrackInfo = computed(() => {
  if (currentTrack.value) {
    if (currentTrack.value.howl.duration === 0) return 0
    // console.log('seek.value ', seek.value)
    let artist = currentTrack.value.artist
    let title = currentTrack.value.title
    let seek2 = seek.value
    let duration = currentTrack.value.howl.duration()
    return {
      artist,
      title,
      seek2,
      duration
    }
  } else {
    return {
      artist: '',
      title: '',
      seek: 0,
      duration: 0
    }
  }
})

const initPlay = computed(() => {
  return store.initPlayState
})
const checkPause = computed(() => {
  return store.onPause
})
const playlistSource = computed(() => {
  return store.source
})
const storageFolder = computed(() => {
  return storeMain.getStorageFolder
})

/// watch

watch(playing, (newValue, oldValue) => {
  seek.value = currentTrack.value.howl.seek()
  let updateSeek
  if (newValue) {
    updateSeek = setInterval(() => {
      seek.value = currentTrack.value.howl.seek()
      //console.log('seek.value ', seek.value)
    }, 250)
  } else {
    clearInterval(updateSeek)
  }
})

watch(initPlay, (newValue, oldValue) => {
  console.log('initPlay ', newValue, oldValue)
  if (newValue) {
    getPlaylist()
    play()
    // this.$store.commit("initPlay", false);
    store.initPlay(false)
  } else {
    //this.stop()
  }
})

watch(checkPause, (newValue, oldValue) => {
  if (newValue) {
    pause()
  }
})

/// methods

function getPlaylist() {
  //setTimeout(() => {
  playlist.value = store.playlist
}
const play = (index) => {
  const sourceNew = store.source

  if (!currentTrack.value) {
    currentTrack.value = selectedTrack.value
  }

  if (source.value && source.value != sourceNew) {
    stop()
  }

  // console.log("currentTrack", currentTrack.value.path);
  // console.log("selectedTrack", selectedTrack.value.path);
  // console.log('playlist.value', playlist.value)

  let selectedTrackIndex = playlist.value.findIndex(
    (track) => track.path === selectedTrack.value.path
  )
  let currentTrackIndex = playlist.value.findIndex(
    (track) => track.path === currentTrack.value.path
  )

  console.log(
    'index selectedTrackIndex currentTrackIndex',
    index,
    selectedTrackIndex,
    currentTrackIndex
  )

  if (!index) {
    if (selectedTrack.value) {
      if (selectedTrack.value.path !== currentTrack.value.path) {
        stop()
      }
      index = selectedTrackIndex
    }
  }
  if (typeof index !== 'number') {
    index = playerIndex.value
  }

  console.log('играем ', index)
  let track = playlist.value[index]
  console.log('track ', track)
  let trackPath = ''

  if (sourceNew == 'tracks') {
    // var src = [`/uploads/${this.$auth.user.id}/buffer/${track.path}`]
    trackPath = `file://${storageFolder.value}/${track.releaseID}/RESTORED/${track.path}.flac`
  } else if (sourceNew == 'stream') {
    trackPath = `/stream/audio/${track.path}.mp3`
  }

  if (track.howl) {
    player.value = track.howl
  } else {
    player.value = track.howl = new Howl({
      src: [trackPath],
      html5: true,
      onend: () => {
        if (loop.value) {
          play(playerIndex.value)
        } else {
          skip('next')
        }
      },
      onplay: () => {
        //console.log('onplay ', player.valueIsActive)
        if (playlist.valueSource == 'stream') {
          // this.waitingMusic = false;
        }
        // this.$store.commit("setPlaying", true);
        store.setPlaying(true)
        // player.valueIsActive = true;
      }
    })
  }

  //console.log('player.value', player.value)
  player.value.play()
  selectedTrack.value = playlist.value[index]
  currentTrack.value = playlist.value[index]
  playerIndex.value = index
  playerIsActive.value = true
  playing.value = true
  source.value = sourceNew
  if (playlist.valueSource == 'stream') {
    //this.waitingMusic = true;
  }

  //console.log('playing ', playing.value, selectedTrack.value)
  var playingTrack = {
    index: index,
    filename: currentTrack.value.path,
    releaseID: currentTrack.value.releaseID
  }

  //this.$store.commit("setPlayingIndex", playingTrack);
  store.setPlayingIndex(playingTrack)
  // this.$store.commit('setPlayerActive', true)
}

const pause = (index) => {
  console.log('pause', currentTrack.value.title)
  currentTrack.value.howl.pause()
  playing.value = false
}
const stop = (index) => {
  //console.log('stop ', currentTrack.value.howl.playing())
  //playlist.value[index].howl.stop()
  currentTrack.value.howl.unload()
  Howler.unload()
  playing.value = false
  //this.$store.commit('player/setPlaying', false)
}
const skip = (direction) => {
  console.log('skip skip ', direction)
  console.log('playlist.value ', playlist.value)
  let index = 0,
    lastIndex = playlist.value.length - 1

  if (shuffle.value) {
    index = Math.round(Math.random() * lastIndex)
    while (index === playerIndex.value) {
      index = Math.round(Math.random() * lastIndex)
    }
  } else if (direction === 'next') {
    index = playerIndex.value + 1
    if (index >= playlist.value.length) {
      index = 0
    }
  } else {
    index = playerIndex.value - 1
    if (index < 0) {
      index = playlist.value.length - 1
    }
  }
  console.log('skipTo ', index)
  skipTo(index)
}
const skipTo = (index) => {
  if (currentTrack.value) {
    currentTrack.value.howl.stop()
  }
  play(index)
}
const toggleLoop = (value) => {
  loop.value = value
}

const toggleShuffle = (value) => {
  shuffle.value = value
}

const setSeek = (percents) => {
  let track = currentTrack.value.howl

  if (track.playing()) {
    track.seek((track.duration() / 100) * percents)
  }
}
</script>
