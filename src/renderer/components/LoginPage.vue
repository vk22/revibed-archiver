<template>
  <section v-if="true" class="login-page">
    <div>
      <v-form class="login-form">
        <v-text-field v-model="key" label="key" required></v-text-field>

        <!-- <v-text-field 
            v-model="password" 
            label="password"
            required></v-text-field> -->

        <div>
          <button class="btn" @click="login">Login</button>
          <!-- <button class="btn" @click="check">check</button> -->
        </div>
      </v-form>
    </div>
  </section>
</template>
<script>
export default {
  layout: 'de',
  data() {
    return {
      key: '',
      password: ''
    }
  },
  mounted() {
    //this.getUser()
  },
  watch: {},
  components: {},
  methods: {
    async getUser() {
      const { data } = await this.$axios.get('http://localhost:8000/api/getuser/')
      console.log('getUser ', data)
      if (data.success) {
        this.$store.commit('setUser', data.user)
        this.$router.push({
          name: 'NewProject'
        })
      }
    },
    async login(e) {
      e.preventDefault()
      try {
        // this.$toast.show('Logging in...');
        const { data } = await this.$axios
          .post('http://localhost:8000/api/login/', {
            key: this.key
          })
          .catch(() => {
            // this.$toast.error('Failed Logging In');
          })

        if (data.success) {
          console.log('data.user ', data.user)
          this.$store.commit('setUser', data.user)
          this.$router.push({
            name: 'NewProject'
          })
        }

        // if (this.$auth.loggedIn) {
        //   this.$toast.success('Successfully Logged In');

        //   await this.$auth.setUser({
        //     username: this.username,
        //     password: this.password
        //   })

        //   setTimeout(() => {
        //     this.$router.push({
        //         name: 'index'
        //     })
        //   }, 250);

        //   setTimeout(() => {
        //     this.$toast.clear()
        //   }, 500);

        // }
      } catch (e) {
        // this.$toast.error('Username or Password wrong');
      }
    },
    check(e) {
      e.preventDefault()
      console.log(this.$auth.loggedIn)
    }
  },
  computed: {
    loading() {
      return this.$store.getters.getLoading
    },
    user() {
      return this.$store.getters.getUser
    }
  }
}
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 100vh;

  .login-form {
    width: 250px;
    text-align: left;
  }
}
</style>
