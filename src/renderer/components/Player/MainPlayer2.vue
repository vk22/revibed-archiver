<template>
  <div>
    <!-- <player-title-bar></player-title-bar>
        <player-info-panel
        :trackInfo="getTrackInfo">
        </player-info-panel> -->
    <!-- <player-controls-bars :loop="loop" :shuffle="shuffle" :progress="progress" :playing="playing"
      :trackInfo="getTrackInfo" :waitingMusic="waitingMusic" :playerIsActive="playerIsActive" @playtrack="play"
      @pausetrack="pause" @stoptrack="stop" @skiptrack="skip" @toggleloop="toggleLoop" @toggleshuffle="toggleShuffle"
      @updateseek="setSeek">
    </player-controls-bars> -->
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
import { ref } from 'vue'
import { Howl, Howler } from "howler";
import PlayerControlsBars from "./PlayerControlsBars.vue";
import { usePlayerStore } from '@/renderer/store/player'
const store = usePlayerStore()

const playlist = ref([])
const index = ref(0)
const playing = ref(false)
const loop = ref(false)
const shuffle = ref(false)
const seek = ref(0)
const waitingMusic = ref(false)
const playerIsActive = ref(false)
const currentTrack = ref(null)
const source = ref(undefined)
const player = ref(undefined)
const track = store.playlist[index];

const trackPath = './src/renderer/components/Player/1012-B.mp3'
const play = () => {

  const sound = new Howl({
    src: ['file:///Users/kushnir/Works/revibed-archiver/src/renderer/components/Player/1012-B.mp3']
  });
  //sound.play();
  Howler.volume(1);
  console.log('sound ', sound)
  // let context = new AudioContext();
  // function play(audioBuffer) {
  //   var source = context.createBufferSource();
  //   source.buffer = audioBuffer;
  //   source.connect(context.destination);
  //   source.start(0);
  // }
  // async function fetchAndPlay() {
  //   context.decodeAudioData(
  //     await fetch('https://upload.wikimedia.org/wikipedia/commons/2/28/Karplus-strong-A2.ogg')
  //       .then(r => r.arrayBuffer()),
  //     decoded => play(decoded));
  // }
  // fetchAndPlay();
}

play()




</script>
