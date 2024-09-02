<template>
  <div class="rip-preview" v-if="rip">
    <v-simple-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left"> title </th>
            <th class="text-left"> releaseID </th>
            <th class="text-left"> labelName </th>
            <th class="text-left"> labelID </th>
          </tr>
        </thead>
        <tbody>
          <td>{{ rip.title }}</td>
          <td>{{ rip.releaseID }}</td>
          <td>{{ rip.labelName }}</td>
          <td>{{ rip.labelID }}</td>
        </tbody>
      </template>
    </v-simple-table>
  </div>
</template>

<script>
export default {
  props: ['rip', 'filesPath'],
  components: {},
  data() {
    return {}
  },
  beforeRouteLeave(to, from, next) {
    //this.checkIfOrderEmpty()
    clearInterval(this.t)
    next()
  },
  methods: {
    play() {
      var playlist = {
        source: 'tracks',
        tracks: []
      }
      var play = {
        index: 0,
        filename: this.rip.tracklist[0].title,
        projectID: this.rip.projectID
      }
      this.rip.tracklist.forEach((track) => {
        playlist.tracks.push({
          projectID: this.rip.projectID,
          projecFormat: this.rip.format,
          title: track.position + '. ' + track.title,
          artist: this.rip.artist,
          path: track.position + '. ' + track.title,
          howl: null,
          display: true
        })
      })
      console.log('playlist ', playlist)
      this.$store.commit('setPlaylist', playlist)
      this.$store.commit('play', play)
    },
    selectTrack() {
      this.$store.commit('setSelectedTrack', {
        projectID: this.rip.projectID,
        projecFormat: this.rip.format,
        title: this.rip.tracklist[0].position + '. ' + this.rip.tracklist[0].title,
        artist: this.rip.artist,
        path: this.rip.tracklist[0].position + '. ' + this.rip.tracklist[0].title,
        howl: null,
        display: true
      })
    },
    pause(index) {
      this.$store.commit('pause', index)
    },
    formatDateEn(date) {
      //console.log('formatDate locale ', state.locale)
      var monthsArr = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
      date = new Date(date)
      const dd = (date.getDate() < 10 ? '0' : '') + date.getDate()
      const MM = monthsArr[date.getMonth()]
      const yyyy = date.getFullYear()
      return dd + ' ' + MM + ' ' + yyyy
    }
  },
  mounted() {},
  computed: {
    playingFile() {
      return this.$store.state.player.playingFile
    },
    checkPause() {
      return this.$store.state.player.onPause
    }
  },
  created() {},
  watch: {}
}
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.rip-preview {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
