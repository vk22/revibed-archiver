const UserLocalData = require("../services/userLocalData");

class UserService {
  constructor() {

  }

  async setUserData(data) {
    console.log('setUserData ', data)
    return await UserLocalData.set(data)
  }

  async getUserData() {
    return await UserLocalData.get()
  }
}

module.exports = new UserService();