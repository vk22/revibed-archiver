<template>
  <div>
    <div class="rip-inner" v-if="rip">
      <div class="backBtn">
        <div @click="goToPrev()"><v-icon>mdi-chevron-left</v-icon> Back</div>
      </div>
      <div class="rip-inner__top">
        <div class="cover">
          <img :src="ripCover" @error="imageLoadError" />
        </div>
        <div class="details position-center-wrapper">
          <div class="rip-info">
            <div class="mb-5">
              <div class="album">
                {{ rip.title }}
              </div>
              <div class="artist">
                {{ rip.artist }}
              </div>
            </div>
            <div class="tags">
              <div class="tag" v-for="(tag, index) in rip.allstyles" :key="index">
                {{ tag }}
              </div>
            </div>
            <div class="mt-4"><b>Discogs release:</b> {{ rip.releaseID }} </div>
            <div class="mt-1"><b>Label:</b> {{ rip.labelName }} </div>
            <div class="mt-1"><b>Country:</b> {{ rip.country }} </div>
            <div class="mt-1" v-if="rip.year"><b>Year:</b> {{ rip.year }} </div>
            <div class="mt-1"><b>Source:</b> {{ rip.source }} </div>
            <div class="mt-1"><b>Quality:</b> {{ rip.quality }} </div>
            <div class="mt-1" v-if="rip.onRevibed.forSale"
              ><b>On Revibed:</b>
              <a
                :href="` https://revibed.com/marketplace/${rip.onRevibed.id}`"
                class="table-item__youtubeLink"
                v-if="rip.onRevibed.forSale"
                target="_blank"
                >{{ rip.onRevibed.id }}</a
              >
            </div>
            <br />
          </div>
        </div>
      </div>
      <div class="rip-inner__bottom">
        <div class="tracklist">
          <TracksOneTrack
            :track="track"
            :rip="rip"
            v-for="(track, index) in tracks"
            :key="index"
            :class="{ playing: playingFile == track.position + '. ' + track.title }"
            :index="index"
            @playtrack="play(index, track.title, track.releaseID)"
            @pausetrack="pause(index)"
          >
          </TracksOneTrack>
        </div>
      </div>
      <v-row>
        <v-col> </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TracksOneTrack from '@/renderer/components/TracksOneTrack.vue'
import { useMainStore } from '@/renderer/store/main'
import { usePlayerStore } from '@/renderer/store/player'
const storePlayer = usePlayerStore()
const storeMain = useMainStore()
const route = useRoute()
const router = useRouter()

function goToPrev() {
  router.go(-1)
}

const formatDateEn = (date) => {
  //console.log('formatDate locale ', state.locale)
  var monthsArr = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec'
  ]
  date = new Date(date)
  const dd = (date.getDate() < 10 ? '0' : '') + date.getDate()
  const MM = monthsArr[date.getMonth()]
  const yyyy = date.getFullYear()
  return dd + ' ' + MM + ' ' + yyyy
}
const ripCover = ref()
const rip = computed(() => {
  const rip = storeMain.getReleaseOne(route.params.id)
  if (rip) {
    rip.allstyles = rip.genres.concat(rip.styles)
    ripCover.value = 'file://' + storageFolder.value + '/' + rip.releaseID + '/cover.jpg'
  }

  return rip
})
const tracks = computed(() => {
  return storeMain.getReleaseTracks(rip.value.releaseID)
})
const storageFolder = computed(() => {
  return storeMain.getStorageFolder
})

function imageLoadError() {
  // alert('Image failed to load');
  ripCover.value = 'file://' + storageFolder.value + '/' + rip.value.releaseID + '/VISUAL/A.jpg'
  //
}

const play = (index, filename, releaseID) => {
  const playlist = {
    source: 'tracks',
    tracks: []
  }
  const play = {
    index: index,
    filename: filename,
    releaseID: releaseID
  }
  tracks.value.forEach((track) => {
    playlist.tracks.push({
      position: track.position,
      releaseID: rip.value.releaseID,
      title: track.position + '. ' + track.title,
      artist: rip.value.artist,
      path: track.position + '. ' + track.title,
      howl: null,
      display: true
    })
  })
  storePlayer.setPlaylist(playlist)
  storePlayer.play(play)
  // this.$store.commit('setPlaylist', playlist)
  // this.$store.commit('play', play)
}

const playingFile = () => {
  storePlayer.playingFile
}

const pause = (index) => {
  storePlayer.pause(index)
}

watch(ripCover, (newValue, oldValue) => {
  console.log(`watch: selected changed from ${oldValue} to ${newValue}`)
})

onMounted(() => {})
</script>



<style lang="scss">
@import '../assets/scss/main.scss';

.rip-inner {
  max-width: 100%;
  // margin: 0 auto;
  padding: 2rem;
  opacity: 1;
  transition: opacity 0.5s ease;

  &.loading {
    opacity: 0.5;
  }

  .backBtn {
    margin-bottom: 1rem;
    margin-left: -0.5rem;
    font-weight: 600;
    cursor: pointer;
    opacity: 0.5;

    &:hover {
      text-decoration: none;
      opacity: 1;
      color: #000;
    }
  }

  &__top {
    display: flex;
    margin-bottom: 2rem;
  }

  .cover {
    width: 40%;
    max-width: 300px;
    margin-right: 2rem;

    img {
      width: 100%;
      box-shadow: 1px 1px 20px #0003;
      border-radius: 6px;
    }
  }

  .position-center-wrapper {
    display: flex;
    flex-direction: column;
    flex: 100;
    justify-content: center;
    text-align: left;
    min-height: 100%;
    position: relative;
  }

  .rip-info {
    margin-bottom: 1rem;
    padding-top: 1rem;

    .artist {
      font-size: 1.75rem;
      line-height: 1.75rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }

    .album {
      font-size: 1.75rem;
      line-height: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;

      .tag {
        font-size: 0.85rem;
        background: #e8e8e8;
        color: #333;
        padding: 0.35rem 0.5rem 0.35rem;
        border-radius: 4px;
        margin-right: 0.25rem;
        margin-bottom: 0.25rem;
        line-height: 1;
      }
    }
  }

  .tools-btns {
    display: flex;

    & > * {
      // flex: 1 1 auto;
      margin-right: 0.25rem;
    }
  }
}
</style>
