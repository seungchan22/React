// server/index.js
// ─────────────────────────────────────────────────────────────────────────────
// 환경설정: .env를 쓰면 아래 줄 유지, 안 쓸 거면 지워도 됩니다.
try { require('dotenv').config(); } catch (_) { /* optional */ }

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(express.json());

// ── 환경변수 + 기본값 ────────────────────────────────────────────────────────
const PORT       = process.env.PORT       || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '0730';   // ← 실제 비밀번호로 변경
const DB_NAME = process.env.DB_NAME || 'testdb';

// ⚠ messages 테이블의 실제 본문 컬럼명으로 고정하세요: 'text' 또는 'message'
const MSG_COL = (process.env.MSG_COL || 'text').trim(); // ← 현재 DB가 text 컬럼이므로 'text'

// ── MySQL Pool ───────────────────────────────────────────────────────────────
const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  connectionLimit: 10,
});

// ── 공용 유틸 ────────────────────────────────────────────────────────────────
const ok = (res, data) => res.json(data);
const fail = (res, tag, err, code = 500) => {
  const detail = (err && (err.sqlMessage || err.message)) || String(err);
  console.error(`[${tag}]`, detail);
  return res.status(code).json({ error: tag, detail });
};

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no_token' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'invalid_token' });
    req.user = decoded;
    next();
  });
}

// ── 헬스체크 ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => ok(res, { ok: true }));

// (선택) 진단 API: 컬럼/샘플 확인용. 필요 없으면 제거 가능
app.get('/_diag/messages', authenticateToken, (req, res) => {
  const result = { checks: {} };
  db.query('SELECT VERSION() AS version', (e1, r1) => {
    if (e1) return fail(res, '_diag.version', e1);
    result.dbVersion = r1[0].version;

    db.query(`SHOW TABLES LIKE 'messages'`, (e2, r2) => {
      if (e2) return fail(res, '_diag.table', e2);
      result.checks.tableExists = r2.length > 0;

      db.query(`SHOW COLUMNS FROM messages`, (e3, r3) => {
        if (e3) return fail(res, '_diag.columns', e3);
        result.columns = r3.map(c => c.Field);
        result.checks.has_text    = result.columns.includes('text');
        result.checks.has_message = result.columns.includes('message');
        result.checks.has_created = result.columns.includes('created_at');

        db.query(`SELECT COUNT(*) AS total FROM messages`, (e4, r4) => {
          if (e4) return fail(res, '_diag.count', e4);
          result.total = r4[0].total;
          db.query(
            `SELECT id, \`${MSG_COL}\` AS msg, created_at
             FROM messages ORDER BY id DESC LIMIT 3`,
            (e5, r5) => {
              if (e5) return fail(res, '_diag.sample', e5);
              result.sample = r5;
              ok(res, result);
            }
          );
        });
      });
    });
  });
});

// ── 사용자(Users) DB 기반 로그인 ─────────────────────────────────────────────
// users 테이블: id, username(UNIQUE), password_hash(bcrypt), created_at
function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1',
      [username],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

// 로그인 (DB 조회 → JWT 발급)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username/password required' });
    }
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const okPass = bcrypt.compareSync(password, user.password_hash);
    if (!okPass) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    ok(res, { token });
  } catch (e) {
    fail(res, 'login_failed', e);
  }
});

// (선택) 회원가입
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username/password required' });
    }
    const exists = await findUserByUsername(username);
    if (exists) return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });

    const hash = bcrypt.hashSync(password, 10);
    db.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash],
      (err, r) => {
        if (err) return fail(res, 'register_failed', err);
        ok(res, { id: r.insertId, username });
      }
    );
  } catch (e) {
    fail(res, 'register_failed', e);
  }
});

// ── messages API (JWT 보호) ─────────────────────────────────────────────────
// 목록: 검색 + 정렬 + 페이지네이션
app.get('/api/messages', authenticateToken, (req, res) => {
  const search = (req.query.search || '').trim();
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const sort   = (req.query.sort || 'id_desc').toLowerCase();

  // 정렬 화이트리스트
  let orderBy = 'id DESC';
  switch (sort) {
    case 'id_asc':   orderBy = 'id ASC'; break;
    case 'id_desc':  orderBy = 'id DESC'; break;
    case 'msg_asc':  orderBy = 'msg ASC'; break;
    case 'msg_desc': orderBy = 'msg DESC'; break;
    case 'date_asc': orderBy = 'created_at ASC'; break;
    case 'date_desc':orderBy = 'created_at DESC'; break;
    default:         orderBy = 'id DESC';
  }

  // 검색: 실제 존재하는 컬럼(MSG_COL)만 사용
  const where = search ? `WHERE \`${MSG_COL}\` LIKE ?` : '';
  const like  = `%${search}%`;

  const countSql = `SELECT COUNT(*) AS total FROM messages ${where}`;
  const dataSql  = `
    SELECT id, \`${MSG_COL}\` AS msg, created_at
    FROM messages
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, search ? [like] : [], (err, cRows) => {
    if (err) return fail(res, 'messages.count', err);
    const total = cRows?.[0]?.total || 0;
    const params = search ? [like, limit, offset] : [limit, offset];
    db.query(dataSql, params, (err2, rows) => {
      if (err2) return fail(res, 'messages.list', err2);
      ok(res, { data: rows, total, page, limit });
    });
  });
});

// 등록 (트랜잭션)
app.post('/api/messages', authenticateToken, (req, res) => {
  const raw = (req.body?.message ?? req.body?.text ?? '').toString();
  const val = raw.trim();
  if (!val) return res.status(400).json({ error: 'message is required' });

  db.getConnection((err, conn) => {
    if (err) return fail(res, 'conn.get', err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

      const sql = `INSERT INTO messages (\`${MSG_COL}\`) VALUES (?)`;
      conn.query(sql, [val], (errIns, result) => {
        if (errIns) {
          return conn.rollback(() => { conn.release(); fail(res, 'messages.insert', errIns); });
        }
        conn.commit((errC) => {
          if (errC) {
            return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
          }
          conn.release();
          ok(res, { id: result.insertId });
        });
      });
    });
  });
});

// 수정 (트랜잭션)
app.put('/api/messages/:id', authenticateToken, (req, res) => {
  const id  = parseInt(req.params.id);
  const raw = (req.body?.message ?? req.body?.text ?? '').toString();
  const val = raw.trim();
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
  if (!val) return res.status(400).json({ error: 'message is required' });

  db.getConnection((err, conn) => {
    if (err) return fail(res, 'conn.get', err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

      const sql = `UPDATE messages SET \`${MSG_COL}\` = ? WHERE id = ?`;
      conn.query(sql, [val, id], (errUpd) => {
        if (errUpd) {
          return conn.rollback(() => { conn.release(); fail(res, 'messages.update', errUpd); });
        }
        conn.commit((errC) => {
          if (errC) {
            return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
          }
          conn.release();
          ok(res, { success: true });
        });
      });
    });
  });
});

// 삭제 (트랜잭션)
app.delete('/api/messages/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

  db.getConnection((err, conn) => {
    if (err) return fail(res, 'conn.get', err);
    conn.beginTransaction((errTx) => {
      if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

      conn.query('DELETE FROM messages WHERE id = ?', [id], (errDel) => {
        if (errDel) {
          return conn.rollback(() => { conn.release(); fail(res, 'messages.delete', errDel); });
        }
        conn.commit((errC) => {
          if (errC) {
            return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
          }
          conn.release();
          ok(res, { success: true });
        });
      });
    });
  });
});

// 글로벌 에러 핸들러(개발 편의)
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT]', err);
  res.status(500).json({ error: 'internal', detail: err?.message || String(err) });
});

// ── 서버 시작 ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`DB: ${DB_USER}@${DB_HOST}/${DB_NAME} (messages.${MSG_COL})`);
});



// // server/index.js
// require('dotenv').config(); // .env 사용 시 (선택)
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const mysql = require('mysql');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ====== 환경변수 / 기본값 ======
// const PORT = process.env.PORT || 5000;
// const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// const DB_HOST = process.env.DB_HOST || 'localhost';
// const DB_USER = process.env.DB_USER || 'root';
// const DB_PASS = process.env.DB_PASS || '0730';     // ← 실제 비밀번호로 변경
// const DB_NAME = process.env.DB_NAME || 'testdb';

// // ⚠️ 실제 messages 테이블 컬럼명에 맞춰 선택하세요: 'message' 또는 'text'
// const MSG_COL = (process.env.MSG_COL || 'text').trim();

// // ====== MySQL 연결 (Pool) ======
// const db = mysql.createPool({
//   host: DB_HOST,
//   user: DB_USER,
//   password: DB_PASS,
//   database: DB_NAME,
//   connectionLimit: 10,
//   // waitForConnections: true,
// });


// // ====== 유틸 / 공용 ======
// const ok = (res, data) => res.json(data);
// const fail = (res, tag, err, code = 500) => {
//   const detail = (err && (err.sqlMessage || err.message)) || String(err);
//   console.error(`[${tag}]`, detail);
//   return res.status(code).json({ error: tag, detail });
// };

// function authenticateToken(req, res, next) {
//   const auth = req.headers['authorization'] || '';
//   const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
//   if (!token) return res.status(401).json({ error: 'no_token' });
//   jwt.verify(token, SECRET_KEY, (err, decoded) => {
//     if (err) return res.status(403).json({ error: 'invalid_token' });
//     req.user = decoded;
//     next();
//   });
// }

// // ====== 헬스체크 ======
// app.get('/health', (req, res) => ok(res, { ok: true }));

// // ====== 로그인 사용자 조회 ======
// function findUserByUsername(username) {
//   return new Promise((resolve, reject) => {
//     db.query(
//       'SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1',
//       [username],
//       (err, rows) => {
//         if (err) return reject(err);
//         resolve(rows[0] || null);
//       }
//     );
//   });
// }

// // ====== 로그인 ======
// // 로그인 (DB 조회)
// app.post('/api/login', async (req, res) => {
//   try {
//     const { username, password } = req.body || {};
//     if (!username || !password) {
//       return res.status(400).json({ message: 'username/password required' });
//     }

//     const user = await findUserByUsername(username);
//     if (!user) {
//       return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
//     }

//     const okPass = require('bcrypt').compareSync(password, user.password_hash);
//     if (!okPass) {
//       return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
//     }

//     const token = require('jsonwebtoken').sign(
//       { id: user.id, username: user.username },
//       SECRET_KEY,
//       { expiresIn: '1h' }
//     );

//     res.json({ token });
//   } catch (e) {
//     console.error('[login]', e);
//     res.status(500).json({ error: 'login_failed', detail: e.message || String(e) });
//   }
// });

// // 회원가입: username 중복 체크 후 생성
// app.post('/api/register', async (req, res) => {
//   try {
//     const { username, password } = req.body || {};
//     if (!username || !password) {
//       return res.status(400).json({ message: 'username/password required' });
//     }

//     // 중복 체크
//     const exists = await findUserByUsername(username);
//     if (exists) return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });

//     const hash = require('bcrypt').hashSync(password, 10);
//     db.query(
//       'INSERT INTO users (username, password_hash) VALUES (?, ?)',
//       [username, hash],
//       (err, r) => {
//         if (err) return res.status(500).json({ error: 'register_failed', detail: err.sqlMessage || String(err) });
//         res.json({ id: r.insertId, username });
//       }
//     );
//   } catch (e) {
//     console.error('[register]', e);
//     res.status(500).json({ error: 'register_failed', detail: e.message || String(e) });
//   }
// });


// // ====== messages API (JWT 보호) ======
// // 목록: 검색 + 정렬 + 페이지네이션
// app.get('/api/messages', authenticateToken, (req, res) => {
//   const search = (req.query.search || '').trim();
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;
//   const sort = (req.query.sort || 'id_desc').toLowerCase();

//   // 정렬 화이트리스트
//   let orderBy = 'id DESC';
//   switch (sort) {
//     case 'id_asc': orderBy = 'id ASC'; break;
//     case 'id_desc': orderBy = 'id DESC'; break;
//     case 'msg_asc': orderBy = 'msg ASC'; break;
//     case 'msg_desc': orderBy = 'msg DESC'; break;
//     case 'date_asc': orderBy = 'created_at ASC'; break;
//     case 'date_desc': orderBy = 'created_at DESC'; break;
//     default: orderBy = 'id DESC';
//   }

//   // const where = search ? 'WHERE COALESCE(text, message) LIKE ?' : '';
//   const where = search ? `WHERE \`${MSG_COL}\` LIKE ?` : '';
//   const like = `%${search}%`;

//   const countSql = `SELECT COUNT(*) AS total FROM messages ${where}`;
//   const dataSql = `
//     SELECT
//       id,
//       \`${MSG_COL}\` AS msg,
//       created_at
//     FROM messages
//     ${where}
//     ORDER BY ${orderBy}
//     LIMIT ? OFFSET ?
//   `;

//   db.query(countSql, search ? [like] : [], (err, countRows) => {
//     if (err) return fail(res, 'messages.count', err);
//     const total = countRows?.[0]?.total || 0;

//     const params = search ? [like, limit, offset] : [limit, offset];
//     db.query(dataSql, params, (err2, rows) => {
//       if (err2) return fail(res, 'messages.list', err2);
//       ok(res, { data: rows, total, page, limit });
//     });
//   });
// });

// // 등록 (트랜잭션)
// app.post('/api/messages', authenticateToken, (req, res) => {
//   const raw = (req.body?.message ?? req.body?.text ?? '').toString();
//   const val = raw.trim();
//   if (!val) return res.status(400).json({ error: 'message is required' });

//   db.getConnection((err, conn) => {
//     if (err) return fail(res, 'conn.get', err);
//     conn.beginTransaction((errTx) => {
//       if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

//       const sql = `INSERT INTO messages (\`${MSG_COL}\`) VALUES (?)`;
//       conn.query(sql, [val], (errIns, result) => {
//         if (errIns) {
//           return conn.rollback(() => { conn.release(); fail(res, 'messages.insert', errIns); });
//         }
//         conn.commit((errC) => {
//           if (errC) {
//             return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
//           }
//           conn.release();
//           ok(res, { id: result.insertId });
//         });
//       });
//     });
//   });
// });

// // 수정 (트랜잭션)
// app.put('/api/messages/:id', authenticateToken, (req, res) => {
//   const id = parseInt(req.params.id);
//   const raw = (req.body?.message ?? req.body?.text ?? '').toString();
//   const val = raw.trim();
//   if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
//   if (!val) return res.status(400).json({ error: 'message is required' });

//   db.getConnection((err, conn) => {
//     if (err) return fail(res, 'conn.get', err);
//     conn.beginTransaction((errTx) => {
//       if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

//       const sql = `UPDATE messages SET \`${MSG_COL}\` = ? WHERE id = ?`;
//       conn.query(sql, [val, id], (errUpd) => {
//         if (errUpd) {
//           return conn.rollback(() => { conn.release(); fail(res, 'messages.update', errUpd); });
//         }
//         conn.commit((errC) => {
//           if (errC) {
//             return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
//           }
//           conn.release();
//           ok(res, { success: true });
//         });
//       });
//     });
//   });
// });

// // 삭제 (트랜잭션)
// app.delete('/api/messages/:id', authenticateToken, (req, res) => {
//   const id = parseInt(req.params.id);
//   if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

//   db.getConnection((err, conn) => {
//     if (err) return fail(res, 'conn.get', err);
//     conn.beginTransaction((errTx) => {
//       if (errTx) { conn.release(); return fail(res, 'tx.begin', errTx); }

//       conn.query('DELETE FROM messages WHERE id = ?', [id], (errDel) => {
//         if (errDel) {
//           return conn.rollback(() => { conn.release(); fail(res, 'messages.delete', errDel); });
//         }
//         conn.commit((errC) => {
//           if (errC) {
//             return conn.rollback(() => { conn.release(); fail(res, 'tx.commit', errC); });
//           }
//           conn.release();
//           ok(res, { success: true });
//         });
//       });
//     });
//   });
// });

// // ====== 글로벌 에러 핸들러 (개발 편의) ======
// app.use((err, req, res, next) => {
//   console.error('[UNCAUGHT]', err);
//   res.status(500).json({ error: 'internal', detail: err?.message || String(err) });
// });

// // ====== 서버 시작 ======
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
//   console.log(`DB: ${DB_USER}@${DB_HOST}/${DB_NAME} (messages.${MSG_COL})`);
// });
