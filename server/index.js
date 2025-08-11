
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
    db.beginTransaction(err => {
      if(err){ throw err; }
        db.query(sql, [text], (err, result) => {
          if(err) {
            return db.rollback(() => {
              throw err;
      });
    }
    db.commit(err => {
      if(err) {
        return db.rollback(() => {
          throw err;
        });
      }
 
      res.status(200).send('Message saved successfully');
    });
  });
});
});

  app.get('/api/messages', (req, res) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const dataSql = `
    SELECT  id, text, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at
      FROM messages
      WHERE text LIKE ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?`;

      const countSql = `
      SELECT COUNT(*) AS total
      FROM messages
      WHERE text LIKE ?`;

    db.query(dataSql, [`%${search}%`, limit, offset], (err, dataResults) => {
    if (err) {
      console.error(err);
      return res.status(500).send('DB Error');
    }
    db.query(countSql, [`%${search}%`], (err2, countResults) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('DB Error');
      }
      res.json({
        data: dataResults,
        total: countResults[0].total,
        page,
        limit
      });
    });
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