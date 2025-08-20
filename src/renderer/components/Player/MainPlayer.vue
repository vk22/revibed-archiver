<template>
  <div class="player-container" :class="{ active: playerIsActive }">
    <!-- <player-title-bar></player-title-bar>
        <player-info-panel
        :trackInfo="getTrackInfo">
        </player-info-panel> -->
    <player-controls-bars :loop="loop" :shuffle="shuffle" :progress="progress" :playing="playing"
      :trackInfo="getTrackInfo" :waitingMusic="waitingMusic" :playerIsActive="playerIsActive" @playtrack="play"
      @pausetrack="pause" @stoptrack="stop" @skiptrack="skip" @toggleloop="toggleLoop" @toggleshuffle="toggleShuffle"
      @updateseek="setSeek" @updatevolume="setVolume">
    </player-controls-bars>
    <!-- <div class="toggle-panel" @click="playlistPanelIsOpen = !playlistPanelIsOpen">
      <button class="btn icon-btn">
        <v-icon small>mdi-access-point</v-icon>
      </button>
    </div> -->
    <!-- <player-search-bar
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
const playlistPanelIsOpen = ref(false)

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
const playingIndex = computed(() => {
  return store.getPlayingIndex
})
const skipToState = computed(() => {
  return store.skipToState
})



/// watch

watch(skipToState, (newValue, oldValue) => {
  if (newValue) {
    console.log('watch skipToState ', newValue);
    console.log('watch playingIndex ', playingIndex.value)
    skipTo(playingIndex.value);
    store.initSkip(false);
  }

})


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
  console.log('MainPlayer play index ', index)

  if (!currentTrack.value) {
    currentTrack.value = selectedTrack.value
  }

  if (source.value && source.value != sourceNew) {
    stop()
  }

  console.log('currentTrack', currentTrack.value.path)
  console.log('selectedTrack', selectedTrack.value.path)
  // console.log('playlist.value', playlist.value)

  let selectedTrackIndex = playlist.value.findIndex(
    (track) => track.path === selectedTrack.value.path
  )
  let currentTrackIndex = playlist.value.findIndex(
    (track) => track.path === currentTrack.value.path
  )

  // console.log(
  //   'index selectedTrackIndex currentTrackIndex',
  //   index,
  //   selectedTrackIndex,
  //   currentTrackIndex
  // )

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

  console.log('играем index', index)
  let track = playlist.value[index]
  //console.log('track ', track)
  let trackPath = ''

  if (sourceNew == 'tracks') {
    trackPath = `file://${storageFolder.value}/${track.releaseID}/RESTORED/${track.path}.flac`
  } else if (sourceNew == 'radio') {
    trackPath = `file://${storageFolder.value}${track.path}`
  } else if (sourceNew == 'stream') {
    trackPath = `/stream/audio/${track.path}.mp3`
  }

  console.log('trackPath ', trackPath)

  if (track.howl) {
    player.value = track.howl
  } else {
    player.value = track.howl = new Howl({
      src: [trackPath],
      html5: true,
      volume: 0.5,
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
  //console.log('pause', currentTrack.value.title)
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
  //console.log('skip skip ', direction)
  //console.log('playlist.value ', playlist.value)
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
  //console.log('skipTo ', index)
  skipTo(index)
}
const skipTo = (index) => {
  console.log('skipTo ', index)
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
const setVolume = (vol) => {
  currentTrack.value.howl.volume(vol)
}
</script>
<style lang="scss">
@import '../../assets/scss/main.scss';

.player-container {
  position: fixed;
  left: 0;
  bottom: -75px;
  width: 100%;
  height: 60px;
  background: #fff;
  display: none;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -0.125rem 1rem rgba(0, 0, 0, 0.075);
  transition: bottom 0.25s ease-in-out;
  z-index: 9999;
  background: #fff;

  &.active {
    display: flex;
  }

  // #loading {
  //   opacity: 0;
  // }

  &.loading {
    // #loading {
    //   opacity: 1;
    // }
    opacity: 0.25;
  }

  .toggle-panel {
    position: fixed;
    right: 0;
    bottom: 100px;
    z-index: 9999;
  }
}
</style>
