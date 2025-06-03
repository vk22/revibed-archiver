const axios = require('axios')
//const API_URL_TOOLS = 'http://localhost:3000';
const API_URL_TOOLS = 'https://tools.revibed.com/api'

class ProjectService {
  constructor() {
    this.releaseID = undefined
    this.releaseData = undefined
    this.source = undefined
  }
  setReleaseData(releaseData, source) {
    this.releaseData = releaseData
    this.releaseID = +releaseData.id
    console.log('ProjectService setReleaseData ', this)
  }
  async addProjectToStore(source) {
    try {
      const project = {
        title: this.releaseData.title,
        artist: this.releaseData.artist,
        releaseID: +this.releaseID,
        labelID: this.releaseData.labelID,
        labelName: this.releaseData.label,
        source: source,
        updated: Date.now()
      }
      // }
    } catch (err) {
      console.log('addProjectToStore err ', err)
    }
  }
  async sendToRevibed(source) {
    console.log('sendToRevibed source', source)
    const { owner, condition, quality } = source
    const release = {
      title: this.releaseData.title,
      artist: this.releaseData.artist,
      releaseID: this.releaseID,
      labelID: this.releaseData.labelID,
      labelName: this.releaseData.label,
      tracklist: this.releaseData.tracklist,
      source: owner,
      sourceCondition: condition,
      quality: quality,
      type: owner === 'Revibed' ? 'coming_soon' : 'goods',
      updated: Date.now()
    }
    const headers = {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
    }
    console.log('sendToRevibed release', release)
    try {
      const data = {
        release: release,
        user: 'admin'
      }
      const response = await axios.post(`${API_URL_TOOLS}/add-release`, data, {
        headers: headers
      })
      return response.data
    } catch (error) {
      console.log('error ', error.message)
      return {
        success: false,
        message: error.message
      }
    }
  }
}

export default new ProjectService()
