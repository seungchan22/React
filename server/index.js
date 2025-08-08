
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
    const sql = 'SELECT id, text, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at FROM messages ORDER BY id DESC';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching messages: ' + err.stack);
        res.status(500).send('Error fetching messages');
        return;
      }
      res.status(200).json(results);
    });
  });

  app.delete('/api/messages/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM messages WHERE id = ?';    
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting message: ' + err.stack);
        res.status(500).send('Error deleting message');
        return;
      }
      res.status(200).send('Message deleted successfully');
    });
  });

  app.put('/api/messages/:id', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if(!text || text.trim() === '') {
      return res.status(400).send('Text is required');
    }

    const sql = 'UPDATE messages SET text = ? WHERE id = ?';
    db.query(sql, [text.trim(), id], (err, result) => {
      if (err) {
        console.error('Error updating message: ' + err.stack);
        res.status(500).send('Error updating message');
        return;
      }
      res.json('Message updated successfully');
    });
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });  