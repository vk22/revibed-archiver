module.exports = {
  port: 8443,
  dbURL: 'mongodb://localhost:27017/kxtools',
  dbOptions: { useNewUrlParser: true },
  ripsStoreFolder: '/Volumes/WD/KX-rips/',
  secret: 'zzz',
  jwtToken: '987654321',
  users: [
    {
      id: 1,
      key: '221981',
      role: 'admin'
    },
    {
      id: 2,
      key: 'KD0xPiPus',
      role: 'ripper1'
    },
    {
      id: 3,
      key: 'EHVteB3KB',
      role: 'ripper2'
    },
    {
      id: 4,
      key: 'iOt88iexa',
      role: 'ripper3'
    }
  ]
}
