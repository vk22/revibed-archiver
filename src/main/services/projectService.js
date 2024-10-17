// const MyStore = require('./store.js')
// const store = new MyStore({
//   configReleases: 'anton-releases-db',
//   configLabels: 'anton-label-db'
// })
const http = require('http')
const axios = require('axios')

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
      // project.updated = {}
      // project.updated.$date = Date.now()
      // const getCandidate = store.get(project.releaseID);
      // console.log('getCandidate ', getCandidate)
      // if (!getCandidate) {
      //     const saveProject = store.set(project.releaseID, project);
      //     console.log('saveProject ', saveProject)
      //     if (!saveProject) {
      //         console.log('save Rip error')
      //     }

      // }
    } catch (err) {
      console.log('addProjectToStore err ', err)
    }
  }
  async sendToRevibed(source) {
    console.log('sendToRevibed source', source)
    const { owner, condition, quality } = source
    const project = {
      title: this.releaseData.title,
      artist: this.releaseData.artist,
      releaseID: this.releaseID,
      labelID: this.releaseData.labelID,
      labelName: this.releaseData.label,
      tracklist: this.releaseData.tracklist,
      source: owner,
      sourceCondition: condition,
      quality: quality,
      updated: Date.now()
    }
    const headers = {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
    }
    console.log('sendToRevibed project', project)
    try {
      const response = await axios.post(`http://labels.kx-streams.com/api/add-release`, project, {
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

    // return new Promise((resolve, reject) => {
    //   try {
    //     var postData = JSON.stringify(project)
    //     const options = {
    //       hostname: 'labels.kx-streams.com',
    //       port: 80,
    //       path: '/api/add-release',
    //       method: 'POST',
    //       headers: {
    //         'content-type': 'application/json',
    //         accept: 'application/json',
    //         'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
    //       }
    //     }
    //     const requestPost = http.request(options, (res) => {
    //       res.setEncoding('utf8')
    //       let body = ''
    //       res.on('data', (chunk) => {
    //         console.log(`BODY: ${chunk}`)
    //         body += chunk;
    //       })
    //       res.on('end', () => {
    //         console.log('No more data in response.', body)
    //       })
    //     })
    //     requestPost.on('error', (e) => {
    //       console.error(`problem with request: ${e.message}`)
    //     })
    //     requestPost.write(postData)
    //     requestPost.end()
    //     resolve(true)
    //   } catch (err) {
    //     console.log('saveReleaseToRevibed err ', err)
    //   }
    // })
  }
}

module.exports = new ProjectService()
