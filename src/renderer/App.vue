<template>
  <div data-app>
    <v-app>
      <!-- notification -->
      <div v-if="loading" class="loading-screen wait-message">
        <v-progress-circular color="red" indeterminate rounded height="6"></v-progress-circular>
      </div>

      <!-- sidebar -->
      <MainSibebar />

      <v-main>
        <v-container fluid class="pa-0 ma-0">
          <!-- main-menu -->
          <div class="main-menu">
            <div class="left">
              <router-link class="link" :to="{ name: 'NewProject' }">Add new</router-link>
              <router-link class="link" :to="{ name: 'RipsList' }">Projects</router-link>

            </div>
            <div class="right">
              <!-- <router-link class="link" :to="{ name: 'RipsList' }">Projects</router-link> -->
              <router-link class="link" :to="{ name: 'User' }" v-if="user">{{ user.username }}</router-link>
              <!-- <div class="userkey" v-on:click="userLogout()" v-if="user">{{ user }}</div> -->
            </div>
          </div>
          <div class="main-container" v-if="true">
            <router-view />
          </div>
        </v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script setup>
import MainSibebar from '@/renderer/components/MainSibebar.vue'
// import LoginPage from '@/renderer/components/LoginPage.vue'
import { onMounted, computed } from 'vue'
import { useMainStore } from '@/renderer/store/main'
import { useUserStore } from '@/renderer/store/user'
const authStore = useUserStore()
const store = useMainStore()
const loading = computed(() => {
  return store.loading
})
const user = computed(() => {
  return authStore.user
})
onMounted(() => {
  store.getServerData()
})
</script>


<!-- <template>
  <DefaultLayout>
    {{ releases }}
    <router-view />
  </DefaultLayout>
</template> -->

<style lang="scss" scoped>
@import './assets/scss/main.scss';

.loading-screen {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  border-radius: 0;

  .v-progress-circular {
    color: mediumvioletred;
  }

  &.wait-message {
    background: #ffffff83;
    //backdrop-filter: blur(10px);
  }

  &.success-message {
    background: #ccffe58c;
  }

  p {
    margin-bottom: 0px !important;
  }
}

.main-menu {
  background: #171717;
  display: flex;
  align-items: center;
  //justify-content: center;
  // padding: 0 1rem;
  width: 100%;
  height: 50px;
  top: 0px;
  position: sticky;
  left: 0;
  z-index: 99;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #171717;

  .left {
    border-left: 1px solid #3a3a3a;
    display: flex;
    height: 100%;
  }

  .right {
    // border-left: 1px solid #3a3a3a;
    display: flex;
    height: 100%;
    align-items: center;
    color: #fff;

    .userkey {
      padding: 1rem;
      cursor: pointer;
    }
  }

  .link {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 1.25rem;
    color: #ffffff;
    border-right: 1px solid #3a3a3a;
    font-weight: 600;
    letter-spacing: 0.15px;

    // background: #fff;
    &:hover {
      color: #ffffff;
      background: #222222;
      // border-bottom: 3px solid #e1e1e1;
    }

    &.router-link-active {
      //background: $color_green;
      background: #111111;
      // border-bottom: 3px solid $color_blue;
      color: #ffffff;
    }
  }
}

.top-tools-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 51px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 99;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 0.75rem;

  .row {
    height: 100%;
  }

  &__buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;

    button {
      margin-right: 1rem;
    }
  }
}
</style>
