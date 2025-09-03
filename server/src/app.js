import express from 'express';
import cors from 'cors';
app.use(cors({
  origin: 'http://localhost:3000',
  allowedHeaders: ['Content-Type','Authorization'],
}));
import morgan from 'morgan';
import router from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandlers.js';

import 'dotenv/config';
import path from 'path';


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', router);

// 임시 체크
// app.get('/ping', (req, res) => res.send('pong'));

app.use(notFound);
app.use(errorHandler);

// 업로드 정적 제공 (썸네일/미리보기 용). 보안상 필요 시 토큰 검증으로 전환 가능
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

app.use((err, req, res, next) => {
console.error(err);
res.status(500).json({ message: 'Server error' });
});

// const port = process.env.PORT || 4000;
// app.listen(port, () => console.log('Server listening on', port));

export default app;

// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import postRoutes from './routes/posts.routes.js';

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get('/ping', (req, res) => res.send('pong')); // 헬스체크

// app.use('/api/posts', postRoutes);                 // ★ 반드시 404 핸들러보다 위

// // ★ 전역 404는 맨 마지막에
// app.use((req, res) => {
//   res.status(404).json({ error: 'not_found', path: req.path });
// });

// const port = process.env.PORT || 4000;
// app.listen(port, () => console.log('Server listening on', port));
