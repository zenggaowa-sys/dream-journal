// 极简 DeepSeek CORS 代理 — 单文件，零依赖
// 用法: node proxy.js
// 前端请求 http://localhost:3456/v1/chat/completions -> 转发到 DeepSeek API

const http = require('http');
const https = require('https');

const PORT = 3456;
const TARGET = 'api.deepseek.com';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const proxyReq = https.request({
      hostname: TARGET,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
    }, proxyRes => {
      // 只转发 content-type，不转发上游的其他头（避免覆盖 CORS）
      const ct = proxyRes.headers['content-type'] || 'application/json';
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': ct,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      res.writeHead(502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`DeepSeek proxy running at http://localhost:${PORT}`);
  console.log('Ready to forward requests to api.deepseek.com');
});
