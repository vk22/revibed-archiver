<template>
  <div class="track-card-small" v-if="track">
    <div class="track-player">
      <div
        class="btn-audio pause"
        @click="pauseTrack(index)"
        v-if="!checkPause && playingFile.filename == track.position + '. ' + track.title"
      >
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
      <div
        class="btn-audio play"
        @click="selectAndPlay(track, index, track.title, rip.projectID)"
        v-else
      >
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
    </div>

    <div class="track-info">
      <div class="track-info__l">
        <div class="mr-3"> {{ track.position }}. </div>
        <div class="track-trackname" @click="pauseTrack(index)">
          {{ track.title }}
        </div>
      </div>

      <div class="track-info__r">
        <div class="add-to">
          <button
            class="btn icon-btn"
            @click="startRadio(track, index, track.title, rip.projectID)"
          >
            <v-icon small>mdi-access-point</v-icon>
          </button>
        </div>
        <div class="add-to">
          <button class="btn icon-btn" disabled>
            <v-icon small>mdi-heart</v-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePlayerStore } from '@/renderer/store/player'
const store = usePlayerStore()

const props = defineProps(['track', 'index', 'rip'])
const emit = defineEmits(['playtrack', 'pausetrack', 'startRadio'])

//// computed

const playingIndex = computed(() => {
  return store.playingIndex
})
const playing = computed(() => {
  return store.playing
})
const playingFile = computed(() => {
  return store.playingFile
})
const checkPause = computed(() => {
  return store.onPause
})
const playlist = computed(() => {
  return store.playlist
})

////

const selectAndPlay = (track, index, title, releaseID) => {
  selectTrack(track)
  playTrack(index, title, releaseID)
}

const selectTrack = (track) => {
  console.log('rip ', props.rip)
  store.setSelectedTrack({
    releaseID: props.rip.releaseID,
    title: track.position + '. ' + track.title,
    artist: props.rip.artist,
    path: track.position + '. ' + track.title,
    howl: null,
    display: true
  })
}

const startRadio = (track) => {
  store.startRadio({
    position: track.position,
    releaseID: props.rip.releaseID,
    title: track.position + '. ' + track.title,
    artist: props.rip.artist,
    path: track.position + '. ' + track.title,
    howl: null,
    display: true
  })
}

const playTrack = () => {
  emit('playtrack')
}

const pauseTrack = () => {
  emit('pausetrack')
}
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.btn-audio {
  width: 24px;
  height: 24px;
  background-size: 30%;
  background-repeat: no-repeat;
  position: relative;
  padding: 0;
  border-radius: 0px;
  background-position: center center;
  //background-color: $color1;
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.75;
  }

  &.play {
    // background-image: url('../assets/img/playBtn.svg');
    svg {
      width: 14px;
      height: 18px;
    }
  }

  &.pause {
    // background-image: url('../assets/img/pauseBtn.svg');
    svg {
      width: 14px;
      height: 18px;
    }
  }
}

.trackItem {
  // transition: transform .25s 1s;
  // transform: translateY(10px);
  &.disabled {
    opacity: 0.35;
  }
}

.form-group.has-error {
  label {
    color: #dc3545 !important;
  }

  input {
    border: 1px solid #dc3545 !important;
  }
}

.track-card-small {
  display: flex;
  padding: 1rem;
  align-items: center;
  border-bottom: 1px solid #ebebeb;
  background: #fff;
  position: relative;
  // box-shadow: 0 4px 8px rgba(17, 12, 103, 0.12);
  border-radius: 0px;
  padding: 0.35rem 0;
  font-size: 1rem;
  line-height: 1.35;
  transition: border-color 0.15s ease-in-out;

  .track-player {
    cursor: pointer;
    margin-right: 0;

    .btn-audio {
      width: 40px;
      height: 40px;
    }
  }

  .track-info {
    overflow: hidden;
    white-space: normal;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 10px;

    &__l {
      display: flex;
    }

    &__r {
      display: flex;
      align-items: center;
      flex-direction: row-reverse;

      .track-duration {
      }

      .add-to {
        // display: flex;
        // align-items: center;
        // justify-content: center;
        // width: 10px;
        // height: 10px;
        // background: #f7f7f7;
        opacity: 1;
        margin-left: 0.5rem;

        .icon-btn {
          // &:hover {
          //   i {
          //     color: #000000;
          //   }
          // }
        }

        .btn.in-playlist {
          background: #212529;
          color: #fff;

          i {
            color: #fff;
          }
        }
      }
    }
  }

  &.playing {
    background: #f7f7f7;

    & > .track-trackname {
      opacity: 0.5;
    }
  }

  &:hover {
    cursor: pointer;

    & > .track-trackname {
      opacity: 0.5;
    }
  }
}

.track-rating-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 150px;
}
</style>
