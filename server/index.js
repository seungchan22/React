
//  import express from 'express'
// const express = require('express') // Uncomment this line if using CommonJS
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0730',
  database: 'testdb'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to the database');
}
);




  app.post('/api/save', (req,res) => {
    const{text} = req.body;
    const sql = 'INSERT INTO messages (text) VALUES (?)';
    db.query(sql, [text], (err, result) => {
      if (err) {
        console.error('Error inserting message: ' + err.stack);
        res.status(500).send('Error inserting message');
        return;
      }
      res.status(200).send('Message saved successfully');
    });
  });

  app.get('/api/messages', (req, res) => {
    const sql = 'SELECT * FROM messages ORDER BY id DESC';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching messages: ' + err.stack);
        res.status(500).send('Error fetching messages');
        return;
      }
      res.status(200).json(results);
    });
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });  