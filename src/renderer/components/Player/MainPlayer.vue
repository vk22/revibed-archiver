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

<script>
import { Howl, Howler } from "howler";
import PlayerControlsBars from "./PlayerControlsBars.vue";
import { useMainStore } from '@/renderer/store/main'
const store = useMainStore()

export default {
  components: {
    // PlayerTitleBar,
    // PlayerPlaylistPanel,
    PlayerControlsBars,
    // PlayerInfoPanel,
    // PlayerSearchBar
  },
  data() {
    return {
      playlist: [],
      // selectedTrack: null,
      index: 0,
      playing: false,
      loop: false,
      shuffle: false,
      seek: 0,
      waitingMusic: false,
      playerIsActive: false,
      currentTrack: null,
      source: undefined,
      player: undefined,
    };
  },
  mounted() {
    //this.getPlaylist()
    this.$store.commit("setPlayerActive", true);
  },
  created() {
    // this.$nuxt.$on('stopPlayer', () => {
    //   console.log('stopPlayer')
    //   this.stop()
    // })
  },
  methods: {
    getPlaylist() {
      //setTimeout(() => {
      this.playlist = this.$store.state.player.playlist;
    },
    // selectTrack (track) {
    //   this.selectedTrack = this.$store.getters['player/getSelectedTrack']
    // },
    play(index) {
      console.log("play play play ", index);

      const sourceNew = this.$store.state.player.source;

      if (!this.currentTrack) {
        this.currentTrack = this.selectedTrack;
      }

      if (this.source && this.source != sourceNew) {
        this.stop();
      }

      // console.log("currentTrack", this.currentTrack.path);
      // console.log("selectedTrack", this.selectedTrack.path);
      // console.log('this.playlist', this.playlist)

      let selectedTrackIndex = this.playlist.findIndex(
        (track) => track.path === this.selectedTrack.path
      );
      let currentTrackIndex = this.playlist.findIndex(
        (track) => track.path === this.currentTrack.path
      );

      console.log(
        "index selectedTrackIndex currentTrackIndex",
        index,
        selectedTrackIndex,
        currentTrackIndex
      );

      if (!index) {
        if (this.selectedTrack) {
          if (this.selectedTrack.path !== this.currentTrack.path) {
            this.stop();
          }
          index = selectedTrackIndex;
        }
      }
      if (typeof index !== "number") {
        index = this.index;
      }

      console.log("играем ", index);
      let track = this.playlist[index];
      console.log("track ", track);
      let trackPath = "";

      if (sourceNew == "tracks") {
        // var src = [`/uploads/${this.$auth.user.id}/buffer/${track.path}`]
        if (track.projecFormat == "CD") {
          trackPath = `file://${this.ripsStoreURL}/${track.projectID}/AUDIO/${track.path}.flac`;
        } else {
          trackPath = `file://${this.ripsStoreURL}/${track.projectID}/RESTORED/${track.path}.flac`;
        }
      } else if (sourceNew == "stream") {
        trackPath = `/stream/audio/${track.path}.mp3`;
      }

      if (track.howl) {
        this.player = track.howl;
      } else {
        this.player = track.howl = new Howl({
          src: [trackPath],
          html5: true,
          onend: () => {
            if (this.loop) {
              this.play(this.index);
            } else {
              this.skip("next");
            }
          },
          onplay: () => {
            //console.log('onplay ', this.playerIsActive)
            if (this.playlistSource == "stream") {
              this.waitingMusic = false;
            }
            this.$store.commit("setPlaying", true);
            // this.playerIsActive = true;
          },
        });
      }

      //console.log('this.player', this.player)
      this.player.play();
      this.selectedTrack = this.playlist[index];
      this.currentTrack = this.playlist[index];
      this.index = index;
      this.playerIsActive = true;
      this.playing = true;
      this.source = sourceNew;
      if (this.playlistSource == "stream") {
        this.waitingMusic = true;
      }

      //console.log('playing ', this.playing, this.selectedTrack)
      var playingTrack = {
        index: index,
        filename: this.currentTrack.path,
        projectID: this.currentTrack.projectID,
      };

      this.$store.commit("setPlayingIndex", playingTrack);
      // this.$store.commit('setPlayerActive', true)
    },
    pause() {
      console.log("pause", this.currentTrack.title);
      this.currentTrack.howl.pause();
      this.playing = false;
    },
    stop() {
      //console.log('stop ', this.currentTrack.howl.playing())
      //this.playlist[index].howl.stop()
      this.currentTrack.howl.unload();
      Howler.unload();
      this.playing = false;
      //this.$store.commit('player/setPlaying', false)
    },
    skip(direction) {
      let index = 0,
        lastIndex = this.playlist.length - 1;

      if (this.shuffle) {
        index = Math.round(Math.random() * lastIndex);
        while (index === this.index) {
          index = Math.round(Math.random() * lastIndex);
        }
      } else if (direction === "next") {
        index = this.index + 1;
        if (index >= this.playlist.length) {
          index = 0;
        }
      } else {
        index = this.index - 1;
        if (index < 0) {
          index = this.playlist.length - 1;
        }
      }
      console.log("skipTo ", index);
      this.skipTo(index);
    },
    skipTo(index) {
      if (this.currentTrack) {
        this.currentTrack.howl.stop();
      }
      this.play(index);
    },
    toggleLoop(value) {
      this.loop = value;
    },
    toggleShuffle(value) {
      this.shuffle = value;
    },
    setSeek(percents) {
      let track = this.currentTrack.howl;

      if (track.playing()) {
        track.seek((track.duration() / 100) * percents);
      }
    },
    // initPlayer() {
    //   this.play(this.$store.state.player.playingIndex)
    // },
  },
  computed: {
    // currentTrack () {
    //   return this.playlist[this.index]
    // },
    selectedTrack: {
      get() {
        return this.$store.state.player.selectedTrack;
      },
      set() {},
    },
    progress() {
      //console.log('this.currentTrack ', this.currentTrack)
      if (this.currentTrack) {
        if (this.currentTrack.howl.duration() === 0) return 0;
        //console.log('progress ', this.seek / this.currentTrack.howl.duration())
        return this.seek / this.currentTrack.howl.duration();
      } else {
        return 0;
      }
    },
    getTrackInfo() {
      if (this.currentTrack) {
        //console.log('getTrackInfo ', this.currentTrack)
        let artist = this.currentTrack.artist,
          title = this.currentTrack.title,
          seek = this.seek,
          duration = this.currentTrack.howl.duration();
        return {
          artist,
          title,
          seek,
          duration,
        };
      } else {
        return {
          artist: "",
          title: "",
          seek: 0,
          duration: 0,
        };
      }
    },
    initPlay() {
      return this.$store.state.player.initPlay;
    },
    checkPause() {
      return this.$store.state.player.onPause;
    },
    playlistSource() {
      return this.$store.state.source;
    },
    ripsStoreURL() {
      return this.$store.getters.getFilesPath;
    },
  },
  watch: {
    playing(playing) {
      this.seek = this.currentTrack.howl.seek();
      let updateSeek;
      if (playing) {
        updateSeek = setInterval(() => {
          this.seek = this.currentTrack.howl.seek();
          //console.log('this.seek ', this.seek)
        }, 250);
      } else {
        clearInterval(updateSeek);
      }
    },
    initPlay(newCount, oldCount) {
      console.log("initPlay ", newCount, oldCount);
      if (newCount) {
        this.getPlaylist();
        this.play();
        this.$store.commit("initPlay", false);
      } else {
        //this.stop()
      }
    },
    checkPause(newCount) {
      if (newCount) {
        this.pause();
      }
    },
  },
};
</script>
