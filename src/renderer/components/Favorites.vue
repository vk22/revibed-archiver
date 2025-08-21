<template>
  <div class="userPlaylist" :class="{ active: true }">
    <div class="userPlaylist__header">
      <div class="panel-title">
        <b>Favorites</b> — {{ $filters.toMinAndHours(favoritesLength) }}
      </div>
      <!-- <div class="panel-close" @click="store.setPlaylistPanelIsOpen()">
        <button class="btn icon-btn">
          <v-icon small>mdi-close</v-icon>
        </button>
      </div> -->
    </div>
    <div class="items-container" :class="{ active: true }">
      <div class="item" v-for="(item, index) in userPlaylist.tracks" :key="index"
        :class="{ playing: playingFile.filename === item.position + '. ' + item.title }">
        <div class="item_l">
          <div class="num">
            {{ index + 1 }}
          </div>
          <div class="cover">
            <div class="track-player"
              :class="{ visible: !checkPause && playingFile.filename == item.position + '. ' + item.title }">
              <div class="btn-audio pause" @click="pauseTrack(index)"
                v-if="!checkPause && playingFile.filename == item.position + '. ' + item.title">
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
              <div class="btn-audio play" @click="play(item, index)" v-else>
                <svg width="26px" height="32px" viewBox="0 0 26 32" version="1.1" xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink">
                  <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.900928442">
                    <g id="playBtn" transform="translate(-97.000000, -1135.000000)" fill="#000000">
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
            <img :src="'file://' + storageFolder + '/' + item.releaseID + '/cover.jpg'" class="cover-img" />
          </div>
          <div class="title">
            {{ item.position }}
            {{ item.title }}
          </div>
        </div>
        <div class="item_r">
          <div class="item-info">
            <div class="artist">
              {{ item.artist }}
            </div>
            <div class="album">
              <div class="link" @click="goToRipPage(item.releaseID)">
                {{ item.releaseID }}
              </div>
            </div>
            <div class="duration">
              {{ $filters.minutes(item.duration) }}
            </div>

            <div class="add-to" :class="{ 'in-favorites': checkIfTrackInUserPlaylist(item) }">
              <button class="btn icon-btn" @click="addToPlaylist(item)">
                <v-icon small>mdi-heart</v-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePlayerStore } from '@/renderer/store/player'
import { useMainStore } from '@/renderer/store/main'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = usePlayerStore()
const storeMain = useMainStore()
const props = defineProps(['favorites'])
const storageFolder = computed(() => {
  return storeMain.getStorageFolder
})
const favoritesLength = ref(null)

const playingFile = computed(() => {
  return store.playingFile
})

const checkPause = computed(() => {
  return store.onPause
})

const userPlaylist = computed(() => {
  return storeMain.playlist
})

const checkIfTrackInUserPlaylist = (track) => {
  if (userPlaylist) {
    return userPlaylist.value.tracks.some(item => item.releaseID === track.releaseID && item.position === track.position)
  } else {
    return false
  }
}

/// play contols

const play = (track, index) => {

  store.setSelectedTrack({
    position: track.position,
    id: track._id,
    releaseID: track.releaseID,
    title: track.position + '. ' + track.title,
    artist: track.artist,
    path: track.position + '. ' + track.title,
    howl: null,
    display: true
  })

  const playlist = {
    source: 'tracks',
    tracks: []
  }
  userPlaylist.value.tracks.forEach((track) => {
    playlist.tracks.push({
      position: track.position,
      releaseID: track.releaseID,
      title: track.position + '. ' + track.title,
      artist: track.artist,
      path: track.position + '. ' + track.title,
      howl: null,
      display: true
    })
  })
  store.setPlaylist(playlist)

  store.play({
    index: index,
    filename: track.title,
    releaseID: track.releaseID
  })

}

const pauseTrack = (index) => {
  store.pause(index)
}

const addToPlaylist = (track) => {

  if (checkIfTrackInUserPlaylist(track)) {

    storeMain.removeFromPlaylist({
      position: track.position,
      releaseID: track.releaseID,
      title: track.title,

    })
  } else {
    storeMain.addToPlaylist({
      position: track.position,
      releaseID: track.releaseID,
      title: track.title,

    })
  }

}

function goToRipPage(releaseID) {
  router.push({ name: 'RipPage', params: { id: releaseID } })
  store.setPlaylistPanelIsOpen()
}

</script>

<style lang="scss">
@import '@/renderer/assets/scss/main.scss';

@keyframes slide-in {
  from {
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

@keyframes slide-out {
  from {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    visibility: hidden;
  }

  to {
    opacity: 1;
    visibility: visible;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    visibility: visible;
  }

  to {
    opacity: 0;
    visibility: hidden;
  }
}

.userPlaylist {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 -0.125rem 1rem rgba(0, 0, 0, 0.075);
  transition: bottom 0.25s ease-in-out;
  z-index: 9999;
  background: #fffffff6;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s ease-in-out;
  animation-duration: 0.25s;
  animation-name: slide-out;
  animation-fill-mode: forwards;

  &.active {
    animation-duration: 0.5s;
    animation-name: slide-in;
    animation-fill-mode: forwards;
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

  .items-container {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    height: 100%;
    overflow: scroll;
    opacity: 0;
    visibility: hidden;
    animation-duration: 0.25s;
    animation-name: slide-out;
    animation-fill-mode: forwards;

    &.active {
      animation-delay: 0.5s;
      animation-duration: 0.5s;
      animation-name: slide-in;
      animation-fill-mode: forwards;
    }
  }

  .item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0.15rem 0.5rem;
    font-size: 0.85rem;
    border-radius: 10px;

    .item_l,
    .item_r {
      display: flex;
      align-items: center;
      width: 50%;
    }

    .num {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      // background-color: #f3f3f3;
      border-radius: 6px;
      color: #555;

      height: 18px;
      width: 18px;
    }

    .cover {
      position: relative;
      width: 50px;
      margin: 0 0.75rem;
      overflow: hidden;
      border-radius: 10px;
      cursor: pointer;

      .track-player {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0000002b;
        opacity: 0;

        .btn-audio {
          justify-content: center;
        }

        #pauseBtn,
        #playBtn {
          fill: #fff;
        }

        &.visible {
          opacity: 1;
        }

        &:hover {
          opacity: 1;
        }
      }

      .cover-img {
        width: 100%;

        padding: 0;
      }
    }

    .item-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding-right: 0.5rem;

      .artist,
      .album,
      .duration {
        display: flex;
        padding: 0 5px;
      }

      .artist {
        width: 40%;
      }

      .album {
        width: 35%;
      }

      .duration {
        // justify-content: flex-end;
        width: 15%;
      }

      .add-to {
        width: 10%;

        &.in-favorites {

          i {
            color: #de1d1d;
          }
        }
      }
    }

    &.playing {
      background: #f0f0f0;
    }
  }

  &__close {
    position: relative;
    top: 0;
    right: 0;
    z-index: 9999;
    padding: 1rem;
  }

  &__header {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    z-index: 9999;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    box-shadow: 0 0.125rem 1rem rgba(0, 0, 0, 0.075);

    .panel-close .btn {
      background-color: #fff !important;
    }
  }
}
</style>
