<template>
  <div class="player" :class="{ active: playerIsActive }">
    <div class="controlsInner">
      <div class="playerBtn" id="prevBtn" @click="skipTrack('prev')">
        <svg
          width="25px"
          height="19px"
          viewBox="0 0 25 19"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <g
            id="Page-1"
            stroke="none"
            stroke-width="1"
            fill="none"
            fill-rule="evenodd"
            opacity="0.900928442"
          >
            <g
              id="Desktop-HD-Copy-3"
              transform="translate(-49.000000, -1142.000000)"
              fill="#000000"
            >
              <g id="player" transform="translate(0.000000, 1112.000000)">
                <g id="Group-4" transform="translate(49.000000, 23.000000)">
                  <g
                    id="Group-2"
                    transform="translate(12.500000, 15.833333) rotate(-180.000000) translate(-12.500000, -15.833333) translate(0.000000, 6.333333)"
                  >
                    <polygon id="Triangle" points="15 9.16666667 0 18.3333333 0 0"></polygon>
                    <polygon id="Triangle" points="25 9.16666667 10 18.3333333 10 0"></polygon>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div class="controlsCenter">
        <div id="loading" v-if="waitingMusic">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            style="margin: auto; display: block"
            width="30px"
            height="30px"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
          >
            <circle
              cx="50"
              cy="50"
              fill="none"
              stroke="#313131"
              stroke-width="10"
              r="40"
              stroke-dasharray="188.49555921538757 64.83185307179586"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                repeatCount="indefinite"
                dur="1s"
                values="0 50 50;360 50 50"
                keyTimes="0;1"
              ></animateTransform>
            </circle>
          </svg>
        </div>
        <div class="playerBtn" id="playBtn" v-if="!playing" @click="playTrack()">
          <svg
            width="26px"
            height="32px"
            viewBox="0 0 26 32"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
              opacity="0.900928442"
            >
              <g
                id="Desktop-HD-Copy-3"
                transform="translate(-97.000000, -1135.000000)"
                fill="#000000"
              >
                <g id="player" transform="translate(0.000000, 1112.000000)">
                  <g id="Group-4" transform="translate(49.000000, 23.000000)">
                    <polygon id="Triangle" points="74 16 48 32 48 0"></polygon>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>
        <div class="playerBtn" id="pauseBtn" v-if="playing" @click="pauseTrack()">
          <svg
            width="22px"
            height="30px"
            viewBox="0 0 22 30"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
          >
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
              opacity="0.900928442"
            >
              <g id="pauseBtn" fill="#000000">
                <g id="Page-1">
                  <g id="Desktop-HD-Copy-3">
                    <g id="player">
                      <g id="Group-4">
                        <g id="Group-6">
                          <rect id="Rectangle" x="0" y="0" width="8" height="30"></rect>
                          <rect id="Rectangle" x="14" y="0" width="8" height="30"></rect>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div class="playerBtn" id="nextBtn" @click="skipTrack('next')">
        <svg
          width="25px"
          height="19px"
          viewBox="0 0 25 19"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <g
            id="Page-1"
            stroke="none"
            stroke-width="1"
            fill="none"
            fill-rule="evenodd"
            opacity="0.900928442"
          >
            <g
              id="Desktop-HD-Copy-3"
              transform="translate(-144.000000, -1142.000000)"
              fill="#000000"
            >
              <g id="player" transform="translate(0.000000, 1112.000000)">
                <g id="Group-4" transform="translate(49.000000, 23.000000)">
                  <g id="Group-2" transform="translate(95.000000, 7.000000)">
                    <polygon id="Triangle" points="15 9.16666667 0 18.3333333 0 0"></polygon>
                    <polygon id="Triangle" points="25 9.16666667 10 18.3333333 10 0"></polygon>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
    <div class="progressInner">
      <!-- <div class="playerBtn" id="volumeBtn"></div> -->
      <div id="timer" class="timer">{{ $filters.minutes(trackInfo.seek2) }}</div>
      <div class="progressCenter">
        <span id="track"> {{ trackInfo.artist }} - {{ trackInfo.title }}</span>
        <div id="bar" ref="bar" @click="updateSeek($event)"></div>
        <div id="progress" :style="{ width: trackProgress }"></div>
      </div>
      <div id="duration" class="timer">{{ $filters.minutes(trackInfo.duration) }}</div>
    </div>
    <div class="volumeInner">
      <v-slider
        dense
        :color="'#222'"
        :track-color="'#222'"
        v-model="volume"
        @input="updateVolume(volume)"
        max="1"
        step="0.1"
      >
      </v-slider>
      <!-- {{ this.volume * 100 + '%' }} -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Howl, Howler } from 'howler'
import PlayerControlsBars from './PlayerControlsBars.vue'
import { usePlayerStore } from '@/renderer/store/player'
const store = usePlayerStore()

const props = defineProps([
  'loop',
  'shuffle',
  'progress',
  'playing',
  'trackInfo',
  'waitingMusic',
  'playerIsActive'
])
const emit = defineEmits(['playtrack', 'pausetrack', 'skiptrack', 'updateseek'])
const muted = ref(false)
const volume = ref(0.5)

const trackProgress = computed(() => {
  return props.progress * 100 + '%'
})

const playTrack = (index) => {
  emit('playtrack', index)
}
const pauseTrack = (index) => {
  emit('pausetrack', index)
}
const skipTrack = (direction) => {
  emit('skiptrack', direction)
}
const updateVolume = (volume) => {
  Howler.volume(volume)
}
const toggleMute = (volume) => {
  Howler.mute(!muted.value)
  muted.value = !muted.value
}

const updateSeek = (event) => {
  //console.log('updateSeek', event.target)
  let el = event.target.getBoundingClientRect(),
    mousePos = event.offsetX,
    elWidth = el.width,
    percents = (mousePos / elWidth) * 100
  // console.log('percents ', el, mousePos, elWidth, percents)
  emit('updateseek', percents)
}

const getClickPosition = (event) => {
  // console.log('getClickPosition', event.target)
  var rect = event.target.getBoundingClientRect()
  var x = event.clientX - rect.left //x position within the element.
  var posX = x / rect.width
  //console.log('posX ', posX)
  //this.seek(posX)
  emit('updateseek', posX)
}
</script>

<style lang="scss">
@import '../../assets/scss/main.scss';

.player {
  position: fixed;
  left: 0;
  bottom: -75px;
  width: 100%;
  height: 60px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -0.125rem 1rem rgba(0, 0, 0, 0.075);
  transition: bottom 0.25s ease-in-out;
  z-index: 9999;
  background: #fff;

  &.active {
    bottom: 0;
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

  .controlsInner {
    position: relative;
    width: 175px;
    // height: 100%;
    // left: 0;
    // margin: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;

    @include for-phone-only {
      width: 200px;
    }

    .controlsCenter {
      display: flex;
      justify-content: flex-start;
      width: 25px;
    }

    .playerBtn {
      position: relative;
      cursor: pointer;
      opacity: 0.9;
      // -webkit-filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.33));
      // filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.33));
      -webkit-user-select: none;
      user-select: none;
      display: flex;

      &:hover {
        opacity: 1;
      }
    }

    #playBtn {
      // background-image: url('../../assets/img/playBtn.svg');
      width: 25px;
      height: 30px;
      // left: 43%;
      // top: 33%;
      background-size: 100%;
      background-repeat: no-repeat;
    }

    #pauseBtn {
      // background-image: url('../../assets/img/pauseBtn.svg');
      width: 20px;
      height: 30px;
      // left: 43%;
      // top: 33%;
      background-size: 100%;
      background-repeat: no-repeat;
    }

    #prevBtn {
      // background-image: url('../../assets/img/prevBtn.svg');
      width: 25px;
      height: 20px;
      // left: 0;
      // top: 33%;
      background-size: 100%;
      background-repeat: no-repeat;
    }

    #nextBtn {
      // background-image: url('../../assets/img/nextBtn.svg');
      width: 25px;
      height: 20px;
      // right: 0;
      // top: 33%;
      background-size: 100%;
      background-repeat: no-repeat;
    }
  }

  .progressInner {
    position: relative;
    display: flex;
    justify-content: space-between;
    width: calc(100% - 400px);
    align-items: center;
    padding: 0 20px;

    @include for-phone-only {
      display: none;
    }

    .progressCenter {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: calc(100% - 120px);
      position: relative;
      height: 100%;

      #bar {
        position: relative;
        top: 4px;
        cursor: pointer;
        width: 100%;
        height: 8px;
        background-color: rgba(0, 0, 0, 0.1);
        opacity: 0.9;

        @include for-phone-only {
          display: none;
        }
      }

      #progress {
        position: relative;
        top: -4px;
        left: 0px;
        width: 0%;
        height: 8px;
        background-color: #000;
        z-index: -1;

        @include for-phone-only {
          display: none;
        }
      }
    }

    .timer {
      font-size: 0.85rem;
    }

    #track {
      position: absolute;
      width: 100%;
      text-align: center;
      font-size: 0.8rem;
      top: 4px;
    }
  }

  .volumeInner {
    position: relative;
    width: 175px;
    // height: 100%;
    // left: 0;
    // margin: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;

    .v-input__slider {
      height: 32px;
    }

    @include for-phone-only {
      display: none;
    }
  }
}
</style>
