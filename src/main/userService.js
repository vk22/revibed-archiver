import UserLocalData from './userLocalData.js'

class UserService {
  constructor() {}

  async setUserData(data) {
    console.log('setUserData ', data)
    return await UserLocalData.set(data)
  }

  async getUserData() {
    console.log('getUserData')
    return await UserLocalData.get()
  }
}

export default new UserService()
