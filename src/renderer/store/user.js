import { defineStore } from 'pinia'
import AuthService from '../services/authService'
// const keytar = require('keytar')

const username = JSON.parse(localStorage.getItem('user'))
const token = JSON.parse(localStorage.getItem('token'))
// console.log('user ', user)
const initialState = username
  ? { username: username, token: token, loggedIn: true }
  : { username: undefined, token: undefined, loggedIn: false }

export const useUserStore = defineStore('user', {
  //state: () => initialState,
  state: () => ({
    user: initialState,
    localFolders: {
      storageFolder: undefined,
      exportFolder: undefined
    }
  }),
  actions: {
    login(user) {
      return AuthService.login(user).then(
        (user) => {
          this.loginSuccess(user)
          return Promise.resolve(user)
        },
        (error) => {
          this.loginFailure()
          return Promise.reject(error)
        }
      )
    },
    loginSuccess(user) {
      console.log('loginSuccess ', user)
      this.user = {
        loggedIn: true,
        username: user.username,
        token: user.token
      }
    },
    loginFailure() {
      this.user = {
        loggedIn: false,
        username: undefined,
        token: undefined
      }
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
    logout() {
      AuthService.logout()
      this.user = {
        loggedIn: false,
        username: undefined,
        token: undefined
      }
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      document.location.reload()
    },
    async getUserLocalData() {
      this.localFolders = await AuthService.getUserLocalData()
    },
    setUserLocalData(data) {
      console.log('setUserLocalData store', data)
      // window.mainApi.invoke('setUserLocalData', data)
      return AuthService.setUserLocalData(data).then(
        (response) => {
          return Promise.resolve(response.data)
        },
        (error) => {
          return Promise.reject(error)
        }
      )
    },
    checkAuth() {
      return {
        user: this.user
      }
    }
  },
  getters: {}
})
