//const FEAT_PATH = path.resolve('data/features.json');
//const FEAT_PATH = '/Users/user/Works_SSD/revibed-archiver/data/features.json';
import { isProxy, toRaw } from 'vue'

function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

function norm(vec) {
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length
  const std = Math.sqrt(vec.reduce((s, v) => s + (v - mean) ** 2, 0) / vec.length) || 1
  return vec.map((v) => (v - mean) / std)
}

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export default class MRecommendations {
  constructor() {
    this.tracksDB = null
  }

  async loadDB() {
    const userLocalFolders = await window.mainApi.invoke('getUserLocalData')
    const storageFolder = toRaw(userLocalFolders).storageFolder
    console.log('storageFolder ', storageFolder)

    const buf = await window.mainApi.invoke('readFile', `${storageFolder}/features.json`)
    this.tracksDB = JSON.parse(buf)
    console.log('tracks loaded ', this.tracksDB.length)
    return this.tracksDB
  }

  async findSimilar(track, k = 10) {
    /// get all tracks features
    // const items = await this.loadDB();
    //console.log('findSimilar ', track)

    // const targetID = `${track.id}`
    // const targetReleaseID = track.releaseID
    const target = this.tracksDB.find(
      (x) => x.position === track.position && x.releaseID === track.releaseID
    )
    this.tracksDB = this.tracksDB.filter((x) => x.releaseID !== track.releaseID)
    //console.log('this.tracksDB ', this.tracksDB.length)
    if (!target) return []

    const tvec = norm(target.features)
    const targetTempo = target.meta.tempoDetected || target.meta.bpmTag || 0

    const scored = []
    for (const it of this.tracksDB) {
      if (it.position === track.position && it.releaseID === track.releaseID) continue

      // 🔹 Фильтр по темпу ±12 BPM
      const tempoIt = it.meta.tempoDetected || it.meta.bpmTag || 0
      if (targetTempo && tempoIt && Math.abs(tempoIt - targetTempo) > 12) continue

      const sim = cosineSimilarity(tvec, norm(it.features))
      scored.push({ track: it, score: sim })
    }

    scored.sort((a, b) => b.score - a.score)
    ///
    const sortNum = 3
    const sortedArr = scored.slice(0, sortNum)
    const randomIndex = randomIntFromInterval(0, sortNum - 1)

    return sortedArr[randomIndex]
  }

  async getTarget(track) {
    /// get all tracks features
    const items = await this.loadDB()
    // console.log('getTarget ', track)

    const target = items.find(
      (x) => x.position === track.position && x.releaseID === track.releaseID
    )
    //console.log('target ', target)
    return target
  }
}
