const express = require('express')
const app = express()
const cors = require('cors')
const Database = require("@replit/database");
const uuid = require("uuid");
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const db = new Database();

app.post('/api/users', (req, res) => {
  let newID = uuid.v4();
  db.set(newID, { _id: newID, username: req.body.username, log: [] }).then(r => {
    res.json({ _id: newID, username: req.body.username });
  });
});


app.get('/api/users', (req, res) => {
  let users = []
  db.list().then(keys => {
    for (let ix = 0; ix < keys.length; ix++) {
      db.get(keys[ix]).then(r => {
        users.push({ _id: keys[ix], username: r.username })
        if (users.length == keys.length) {
          res.json(users)
        }
      })
    }
  });
});

function assessPostedDate(input) {
  if (input == '' || input == undefined) {
    return new Date().toDateString().toString()
  } else {
    return new Date(input).toDateString().toString()
  }
}

app.post('/api/users/:_id/exercises', (req, res) => {
  let userID = req.url.split('/')[3];
  db.get(userID).then(user => {
    let currentUser = user;
    let currentUserLogs = currentUser['log']
    currentUserLogs.push({ description: req.body.description, duration: parseFloat(req.body.duration), date: assessPostedDate(req.body.date).toString() })
    db.set(userID, { _id: userID, username: currentUser.username, log: currentUserLogs }).then(r => { res.json({ username: user.username, description: req.body.description, duration: parseInt(req.body.duration), date: assessPostedDate(req.body.date).toString(), _id: user._id }) })
  });
});

app.get('/api/users/*/logs', (req, res) => {
  let userID = req.url.split('/')[3];
  db.get(userID).then(user => {
    if (req.query['from'] != undefined && req.query['to'] != undefined) {
      let logArray = []
      for (let ix = 0; ix < user.log.length; ix++) {
        if (new Date(user.log[ix].date).getTime() <= new Date(req.query['to']).getTime() && new Date(user.log[ix].date).getTime() >= new Date(req.query['from']).getTime()) {
          logArray.push(user.log[ix])
        }
      }
      setTimeout(() => {
        if (req.query['limit'] != undefined) {
          res.json({ username: user.username, count: user.log.length, _id: user._id, log: logArray.slice(-parseInt(req.query['limit'])) });

        } else {
          res.json({ username: user.username, count: user.log.length, _id: user._id, log: logArray });
        }

      }, 300)
    } else {
      if (req.query['limit'] != undefined) {
        if (req.query['from'] == undefined && req.query['to'] == undefined) {
          res.json({ username: user.username, count: user.log.length, _id: user._id, log: user.log.slice(-parseInt(req.query['limit'])) });
        }
      } else {
        res.json({ username: user.username, count: user.log.length, _id: user._id, log: user.log });
      }
    }
  });


});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
