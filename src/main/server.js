const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')

// const server = require("./server");
// const api = require("./server/api");
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cors())
app.use(
  express.urlencoded({
    extended: true
  })
)
app.use(express.json())
app.use(import(__dirname + '/routes/routes.js'))
// app.use(require('./routes/user'))
// app.use("/", server);
// app.use("/api", api);

// Listen the server
var listener = app.listen(8000, '0.0.0.0', function () {
  console.log('server is running:' + listener.address().port)
})

// module.exports = app
