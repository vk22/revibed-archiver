<template>
  <div>
    <div class="rip-inner" v-if="rip">
      <div class="backBtn">
        <div @click="goToPrev()"><v-icon>mdi-chevron-left</v-icon> Back</div>
      </div>
      <div class="rip-inner__top">
        <!-- {{ ripCover }} -->
        <div class="cover">
          <img :src="ripCover" @error="imageLoadError">
          <!-- <img :src="'file://' + storageFolder + '/' + rip.releaseID + '/VISUAL/A.jpg'"
            v-if="storageFolder + '/' + rip.releaseID + '/VISUAL/A.jpg'"> -->

        </div>
        <div class="details position-center-wrapper ">
          <div class="rip-info">
            <div class="mb-3">
              <div class="artist">
                {{ rip.artist }}
              </div>
              <div class="album">
                {{ rip.title }}
              </div>
            </div>
            <div class="tags mb-5">
              <div class="tag2" v-if="rip.country && rip.country != '---'">{{ rip.country }}</div>
              <div class="tag2" v-if="rip.year && rip.year != '---'">, {{ rip.year }}</div>
            </div>
            <div class="tags">
              <div class="tag" v-for="(tag, index) in rip.style" :key="index">
                {{ tag }}
              </div>
            </div>
            <div class="mt-5">
              Discogs release: {{ rip.releaseID }}
            </div>
            <br>
          </div>
          <!-- <div class="tools-btns">

            <button class="btn sm-btn" @click="sendToRevibed">Send To Revibed</button>
            <button class="btn sm-btn" @click="archiveRip">Archive</button>
            <button class="btn sm-btn" @click="getTracklist">Get Discogs</button>


            <div class="delete-btn">
              <v-dialog v-model="dialog" width="500">
                <template v-slot:activator="{ on, attrs }">
                  <button class="btn sm-btn outline" v-bind="attrs" v-on="on">Delete</button>
                </template>

<v-card>
  <v-card-title class="text-h5 grey lighten-2">
    <h4>Delete forever?</h4>
  </v-card-title>


  <v-divider></v-divider>

  <v-card-actions>
    <v-spacer></v-spacer>
    <button class="btn sm-btn outline" @click="deleteRip">Delete forever</button>
  </v-card-actions>
</v-card>
</v-dialog>
</div>

</div> -->
        </div>

      </div>
      <div class="rip-inner__bottom">



        <div class="tracklist">
          <TracksOneTrack :track="track" :rip="rip" v-for="(track, index) in tracks" :key="index">
          </TracksOneTrack>
        </div>

      </div>
      <v-row>
        <v-col>



        </v-col>
      </v-row>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TracksOneTrack from '@/renderer/components/TracksOneTrack.vue'
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()
const route = useRoute()
const router = useRouter()

function goToPrev() {
  router.go(-1);
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
  const rip = store.getReleaseOne(route.params.id)
  if (rip) {
    ripCover.value = 'file://' + storageFolder.value + '/' + rip.releaseID + '/VISUAL/Front.jpg'
  }
  return rip
})
const tracks = computed(() => {
  return store.getReleaseTracks(rip.value.releaseID)
})
const storageFolder = computed(() => {
  return store.getStorageFolder
})



console.log('rip ', rip)

function imageLoadError() {
  // alert('Image failed to load');
  ripCover.value = 'file://' + storageFolder.value + '/' + rip.value.releaseID + '/VISUAL/A.jpg'
  // 
}

watch(ripCover, (newValue, oldValue) => {
  console.log(`watch: selected changed from ${oldValue} to ${newValue}`)
})

onMounted(() => { })
</script>

<!-- <script>

import TracksOneTrack from '../components/TracksOneTrack.vue'

export default {
  props: [],
  components: {
    TracksOneTrack
  },
  data() {
    return {
      loading: false,
      dialog: false,
      responseStatus: undefined
    }
  },
  beforeRouteLeave(to, from, next) {
    //this.checkIfOrderEmpty()
    clearInterval(this.t)
    next()
  },
  methods: {
    play(index, filename, projectID) {
      var playlist = {
        source: 'tracks',
        tracks: []
      }
      var play = {
        index: index,
        filename: filename,
        projectID: projectID
      }
      this.rip.tracklist.forEach((track) => {
        playlist.tracks.push({ projectID: this.rip.projectID, projecFormat: this.rip.format, title: track.position + '. ' + track.title, artist: this.rip.artist, path: track.position + '. ' + track.title, howl: null, display: true })
      })
      this.$store.commit('setPlaylist', playlist)
      this.$store.commit('play', play)
    },
    pause(index) {
      this.$store.commit('pause', index)
    },
    setPlaylist() {
      var playlist = {
        source: 'tracks',
        tracks: []
      }
      console.log('this.rip ', this.rip)
      this.rip.tracklist.forEach((track) => {
        if (typeof track === 'object') {
          playlist.tracks.push({ projectID: this.rip.projectID, title: track.position + '. ' + track.title, artist: this.rip.artist, path: track.position + '. ' + track.title, howl: null, display: true })
        } else {
          playlist.tracks.push({ projectID: this.rip.projectID, title: track, artist: this.rip.artist, path: track, howl: null, display: true })
        }
      })
      this.$store.commit('setPlaylist', playlist)
    },
    async archiveRip() {
      this.$store.commit('setLoading', true)
      const responseRip = await this.$axios.post('http://localhost:8000/api/archive-rip/', { rip: this.rip })
      console.log('responseRip ', responseRip)
      this.$store.commit('setLoading', false)
    },
    async deleteRip() {
      this.$store.commit('setLoading', true)
      const responseRip = await this.$axios.delete('http://localhost:8000/api/delete-rip/' + this.rip.projectID)
      console.log('responseRip ', responseRip)
      this.$store.commit('setLoading', false)
      this.dialog = false;
      this.$store.dispatch('getRips')
      this.$router.push('/rips-list');
    },
    async sendToRevibed() {
      this.$store.commit('setLoading', true)
      const responseRip = await this.$axios.post('http://localhost:8000/api/send-to-revibed/', { rip: this.rip })
      console.log('responseRip ', responseRip)
      this.$store.commit('setLoading', false)
    },

    async getTracklist() {
      const responsegetTracklist = await this.$axios.post('http://localhost:8000/api/edit-rip-tracklist/', { releaseID: this.rip.releaseID, projectID: this.rip.projectID })
      console.log('responseRip ', responsegetTracklist)
    },
    goToPrev() {
      this.$router.go(-1);
      //this.$router.push('/rips-list')
    },

  },
  mounted() {
    console.log('this.$router ', this.$route.params.id)
    // this.$router.push({ path: '/one-rip/111723' })
  },
  computed: {
    filesPath() {
      return this.$store.getters.getFilesPath
    },
    rip() {
      return this.$store.getters.getReleaseOne(this.$route.params.id);
    },
    playingFile() {
      return this.$store.state.player.playingFile;
    },
  },
  created() {
    setTimeout(() => {
      //this.setPlaylist()
    }, 8000);

  },
  watch: {

  }
}
</script> -->

<style lang="scss">
@import "../assets/scss/main.scss";

.rip-inner {
  max-width: 100%;
  // margin: 0 auto;
  padding: 2rem;
  opacity: 1;
  transition: opacity 0.5s ease;

  &.loading {
    opacity: .5;
  }


  .backBtn {
    margin-bottom: 1rem;
    margin-left: -0.5rem;
    font-weight: 600;
    cursor: pointer;
    opacity: .5;

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

    .artist {
      font-size: 2rem;
      line-height: 2rem;
      font-weight: 600;
      margin-bottom: .5rem;
    }

    .album {
      font-size: 2rem;
      line-height: 2rem;
      margin-bottom: 1rem;
    }


    .tags {
      display: flex;
      flex-wrap: wrap;
      margin-top: .5rem;

      .tag {
        background: #f1f1f1;
        color: #333;
        padding: 0.5rem 0.75rem 0.5rem;
        border-radius: 35px;
        margin-right: 0.25rem;
        margin-bottom: 0.25rem;
        line-height: 1;
      }
    }

  }

  .tools-btns {
    display: flex;

    &>* {
      // flex: 1 1 auto;
      margin-right: .25rem;
    }
  }
}
</style>
