// Vercel Serverless Function - archive.org / coverartarchive.org 图片反向代理
// 在函数内部跟随重定向，直接获取图片内容并返回
// 支持两种路径：
//   /download/xxx        -> https://archive.org/download/xxx
//   /release/xxx/front-500  -> https://coverartarchive.org/release/xxx/front-500
//   /release-group/xxx/front-500 -> https://coverartarchive.org/release-group/xxx/front-500

export default async function handler(req, res) {
  // 只处理 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 从 query 参数中提取路径（vercel.json rewrites 将 /:path* 映射到 ?path=:path*）
  const url = new URL(req.url, `https://${req.headers.host}`);
  const targetPath = url.searchParams.get('path');

  if (!targetPath) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // 根据路径前缀决定目标 URL
  let targetUrl;
  if (targetPath.startsWith('download/')) {
    targetUrl = `https://archive.org/download/${targetPath.slice('download/'.length)}`;
  } else if (targetPath.startsWith('release/')) {
    targetUrl = `https://coverartarchive.org/release/${targetPath.slice('release/'.length)}`;
  } else if (targetPath.startsWith('release-group/')) {
    targetUrl = `https://coverartarchive.org/release-group/${targetPath.slice('release-group/'.length)}`;
  } else {
    res.status(400).json({ error: 'Unsupported path' });
    return;
  }

  try {
    // 跟随重定向获取图片内容
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArchiveProxy/1.0)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      res.status(response.status).end();
      return;
    }

    // 转发响应头
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    // 缓存 7 天
    res.setHeader('Cache-Control', 'public, max-age=604800');

    // 转发图片内容
    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: 'Bad Gateway' });
  }
}
