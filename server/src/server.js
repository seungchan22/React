// import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';

console.log('[BOOT] CWD=', process.cwd(), 'JWT_SECRET set?', !!process.env.JWT_SECRET);

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

server.on('error', (err) => {
  console.error('[listen error]', err.code, err.message);
});

// import 'dotenv/config';

// import app from './app.js';

// const port = process.env.PORT || 4000 ;
// app.listen(port, () => console.log('Server listening on', port));