<template>
  <section class="user-page">
    <div class="user-container">
      <div class="user">
        <div class="avatar">
          <v-avatar color="#ddd" size="x-large"></v-avatar>
        </div>
        <div class="username">{{ user.username }}</div>
      </div>
      <div class="field">
        <label>Music Storage</label>
        <input class="input" v-model="localFolders.storageFolder" type="text" :placeholder="'Path to local folder'" />
      </div>
      <div class="field">
        <label>Export Folder</label>
        <input class="input" v-model="localFolders.exportFolder" type="text" :placeholder="'Path to local folder'" />
      </div>
      <!-- <div class="userrole">manager</div> -->
      <div class="mt-2 mb-3">
        <button class="btn main" @click="save()">Save</button>
      </div>
      <div class="">
        <button class="btn outline" @click="logout()">Logout</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/renderer/store/user'
const authStore = useUserStore()
const user = computed(() => {
  return authStore.user
})

  ; (async () => {
    await authStore.getUserLocalData()
  })()

const localFolders = computed(() => {
  if (authStore.localFolders) {
    return authStore.localFolders
  } else {
    return {
      storageFolder: '',
      exportFolder: ''
    }
  }
})

console.log('localFolders ', localFolders)

const logout = () => {
  authStore.logout()
}

const save = () => {
  console.log('localFolders ', localFolders.value)
  authStore.setUserLocalData(localFolders.value)
}
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.user-page {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: center;
  padding: 2rem;
  min-height: calc(100vh - 50px);

  .user-container {
    width: 350px;
    text-align: left;

    .user {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e5e5;
    }

    .avatar {
      margin-right: .75rem;
    }

    .username {
      font-size: 1.5rem;
      line-height: 1.5rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin: 0.15rem 0;
    }

    input {
      display: block;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      color: #333;
      // background-color: #ffffff40;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid #999;
      //border-bottom: 1px solid #909090;
      box-shadow: none;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      width: 100%;
      max-width: 100%;
      font-size: .85rem;

      // @include for-700-height-only {
      //   padding: 1rem 0.75rem;
      // }
      &::placeholder {
        font-size: 0.95rem;
      }

      &:focus {
        outline: none;
      }
    }

    .field {
      width: 100%;
      margin-bottom: 0.75rem;

      // @include for-700-height-only {
      //   margin-bottom: 0.35rem;
      // }
      // @include for-800-height-only {
      //   margin-bottom: 0.35rem;
      // }
    }

    .errors {
      position: relative;
    }

    .errors ul,
    .errors {
      list-style: none;
      margin: 0;
      padding: 0;
      color: #dc3545;
      font-size: 13px;
    }
  }

  .btn {
    width: 100%;
  }
}
</style>
