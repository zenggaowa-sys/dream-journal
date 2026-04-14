// 极简 DeepSeek CORS 代理 — 单文件，零依赖
// 用法: node proxy.js
// 前端请求 http://localhost:3456/v1/chat/completions -> 转发到 DeepSeek API

const http = require('http');
const https = require('https');

const PORT = 3456;
const TARGET = 'api.deepseek.com';

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      res.writeHead(502);
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
