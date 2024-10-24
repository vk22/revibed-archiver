import axios from 'axios'

//const API_URL_LABELS = 'http://localhost:3000/auth'
const API_URL_LABELS = 'http://labels.kx-streams.com/api/auth/'
// const API_URL = 'http://localhost:8000/api'
//const API_URL = 'http://labels.kx-streams.com/api/auth/'

class AuthService {
  login(user) {
    return axios
      .post(API_URL_LABELS + '/login', {
        username: user.username,
        password: user.password
      })
      .then((response) => {
        if (response.data.token) {
          localStorage.setItem('user', JSON.stringify(response.data.username))
          localStorage.setItem('token', JSON.stringify(response.data.token))
        }
        return response.data
      })
  }

  logout() {
    localStorage.removeItem('user')
  }

  register(user) {
    return axios.post(API_URL_LABELS + '/register', {
      username: user.username,
      email: user.email,
      password: user.password
    })
  }

  getuser(token) {
    return axios.get(API_URL_LABELS + '/user', {
      params: {
        token: token
      }
    })
  }
  getusers(token) {
    return axios.get(API_URL_LABELS + '/users', {
      params: {
        token: token
      }
    })
  }

  getUserLocalData() {
    return new Promise((resolve, reject) => {
      window.mainApi.invoke('getUserLocalData').then((result) => {
        resolve(result)
      })
    })
  }
  setUserLocalData(data) {
    const dataParsed = JSON.parse(JSON.stringify(data))
    return new Promise((resolve, reject) => {
      window.mainApi.invoke('setUserLocalData', dataParsed).then((result) => {
        console.log('AuthService result ', result)
        resolve(result)
      })
    })
  }
}

export default new AuthService()
