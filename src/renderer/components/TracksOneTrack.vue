<template>
  <div class="track-card-small" v-if="track">
    <div class="track-player">
      <div class="btn-audio pause" @click="pauseTrack(index)"
        v-if="!checkPause && playingFile.filename == track.position + '. ' + track.title">
        <svg width="22px" height="30px" viewBox="0 0 22 30" version="1.1" xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.900928442">
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
      <div class="btn-audio play" @click="selectAndPlay(track, index, track.title, rip.projectID)" v-else>
        <svg width="26px" height="32px" viewBox="0 0 26 32" version="1.1" xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.900928442">
            <g id="Desktop-HD-Copy-3" transform="translate(-97.000000, -1135.000000)" fill="#000000">
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
      <div class="mr-3"> {{ track.position }}. </div>
      <div class="track-trackname" @click="pauseTrack(index)">
        {{ track.title }}
      </div>
      <!-- <div class="track-info__r">
        <div class="track-duration">
          {{ props.rip }}
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePlayerStore } from '@/renderer/store/player'
const store = usePlayerStore()

const props = defineProps(['track', 'index', 'rip'])
const emit = defineEmits(['playtrack', 'pausetrack'])

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

const playTrack = () => {
  emit('playtrack')
}

const pauseTrack = () => {
  emit('pausetrack')
}
</script>

<!-- <script>
export default {
  middleware: ['auth'],
  props: ['track', 'index', 'rip'],
  components: {},
  data() {
    return {
      hasError: false,
      checkFileResponse: true,
      country: '',
      genre: '',
      style: '',
      tag: '',
      // canSave: false,
      openTagsInputPanelState: false,
      openTagsInputPanelCat: undefined,
      checkedtrack: undefined
      // playlist: []
    }
  },
  beforeRouteLeave(to, from, next) {
    //this.checkIfOrderEmpty()
    clearInterval(this.t)
    next()
  },
  methods: {
    openPlaylistPanel() {
      var data = {
        isOpen: true,
        tracks: [this.track]
      }
      this.$store.commit('playlist/setAddPlaylistPanelState', data)
    },
    async deleteTrack() {
      const response = await this.$axios.$post('/delete-track-buffer', { track: this.track })
      console.log('delete response ', response)
      this.ifTrackDeleted = response.success
      this.$emit('trackSaved', null)
    },
    removeDublikates(data) {
      return data.filter(
        (item, index, self) => index === self.findIndex((t) => t.text === item.text)
      )
    },
    selectTrack(track) {
      this.$store.commit('setSelectedTrack', {
        projectID: rip.value.projectID,
        projecFormat: rip.value.format,
        title: track.position + '. ' + track.title,
        artist: rip.value.artist,
        path: track.position + '. ' + track.title,
        howl: null,
        display: true
      })
    },
    playTrack() {
      this.$emit('playtrack')
    },
    pauseTrack() {
      this.$emit('pausetrack')
    },
    checkThisTrack(event, track) {
      var data = {
        isChecked: event.target.checked,
        track: track
      }
      // $nuxt.$emit('checkForDelete', data)
      this.$store.commit('tracksStore/setCheckedList', data)
    },
    openTagsInputPanel(cat) {
      var data = {
        isOpen: true,
        category: cat,
        track: this.track,
        multi: false
      }
      this.$store.commit('setTagsInputPanelState', data)
    },
    openTrackStreamsPanel() {
      if (this.track.plays.length) {
        var data = {
          isOpen: true,
          streams: this.track.plays
        }
        this.$store.commit('tracksStore/setTrackStreamsPanel', data)
      }
    }
    // checkIsCanSave(trackIds) {
    //   //console.log('checkIsCanSave ', trackIds)
    //   const canSave = trackIds.some(id => id === this.track.id)
    //   if (canSave) {
    //       this.track.canSave = true
    //       //this.saveTrack()
    //   }
    //   //console.log('this.track.canSave ', this.track.canSave)
    // }
  },
  mounted() { },
  computed: {
    // playingIndex() {
    //   return this.$store.state.player.playingIndex
    // },
    // playing() {
    //   return this.$store.state.player.playing
    // },
    // playingFile() {
    //   return this.$store.state.player.playingFile
    // },
    // checkPause() {
    //   return this.$store.state.player.onPause
    // },
    // playlist() {
    //   return this.$store.state.playlist.playlist
    // },
    // videolist() {
    //   return this.$store.getters['video/getVideoList']
    // },
    // streamlist() {
    //   return this.$store.getters['video/getStreamList']
    // }
  },
  created() {
    // this.$nuxt.$on('trackCanSave', (data) => {
    //   this.checkIsCanSave(data)
    // })
    // this.$nuxt.$on('returnvalue', (value) => {
    //    console.log('returnRatingValue ', value)
    // });
  },
  watch: {}
}
</script> -->

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
    justify-content: flex-start;
    padding-right: 10px;

    &__r {
      display: flex;
      align-items: center;
      flex-direction: row-reverse;

      .track-duration {}

      .add-to {
        // display: flex;
        // align-items: center;
        // justify-content: center;
        // width: 10px;
        // height: 10px;
        // background: #f7f7f7;
        margin-left: 1rem;

        .icon-btn {
          &:hover {
            i {
              color: #000000;
            }
          }
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

    &>.track-trackname {
      opacity: 0.5;
    }
  }

  &:hover {
    cursor: pointer;

    &>.track-trackname {
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
