<template>
  <section class="login-page">
    <div>
      <div class="login-form">
        <div class="field">
          <input
            class="input"
            id="username"
            v-model="user.username"
            type="text"
            :placeholder="'Username'"
          />
        </div>
        <div class="field">
          <input
            class="input"
            id="pw"
            v-model="user.password"
            type="password"
            :placeholder="'Password'"
          />
        </div>
        <div class="field">
          <button @click="login" class="main-btn">Login</button>
        </div>
        <div class="message text-center">
          {{ message }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/renderer/store/user'
const authStore = useUserStore()
const router = useRouter()
const user = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const message = ref('')

function login() {
  console.log('user ', user.value)
  loading.value = true

  authStore.login(user.value).then(
    () => {
      router.push('/')
    },
    (error) => {
      loading.value = false
      message.value =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString()
    }
  )
}
</script>

<style lang="scss">
@import '../assets/scss/main.scss';

.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: calc(100vh - 50px);

  .login-form {
    width: 250px;
    text-align: left;

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
      padding: 1rem 1rem;
      border-radius: 4px;
      width: 100%;
      max-width: 100%;
      font-size: 1rem;

      // @include for-700-height-only {
      //   padding: 1rem 0.75rem;
      // }

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
