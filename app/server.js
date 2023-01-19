'use strict';

const express = require('express');

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.post('/',jsonParser, (req, res) => {
  console.log(req.url)
  console.log(req.method)
  console.log(req.body)
  res.send('Hello World');
});

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});