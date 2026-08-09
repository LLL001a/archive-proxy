# Archive Proxy

基于 Vercel Serverless Function 的图片反向代理，用于代理 **archive.org** 和 **coverartarchive.org** 的图片资源。

主要解决国内服务器无法直接访问 archive.org（Internet Archive）导致的图片加载失败问题，常用于音乐封面、专辑封面等场景。

## ✨ 功能特性

- 🖼️ 代理 **archive.org** 图片（`/download/...` 路径）
- 🎵 代理 **coverartarchive.org** 封面图（`/release/...`、`/release-group/...` 路径）
- 🔄 在函数内部**跟随重定向**，直接获取图片内容并返回，客户端无需访问 archive.org
- ⚡ 基于 Vercel Serverless，完全免费，无需维护服务器
- 🚀 支持跨域（CORS）
- 💾 响应带 7 天缓存头，减少重复请求

## 🧠 工作原理

`coverartarchive.org` 的封面图片 URL 会 **307 重定向**到 `archive.org` 的 CDN 节点（如 `dn720704.ca.archive.org`）。国内服务器通常无法访问这些域名。

本项目通过 Vercel Serverless Function 作为中间代理：

```
客户端 → Vercel 代理 (archive.jgyun.top) → archive.org / coverartarchive.org
```

代理函数在内部**跟随重定向**，直接获取图片内容并返回给客户端。客户端只需访问 Vercel 域名，无需访问 archive.org。

## 📁 项目结构

```
archive-proxy/
├── api/
│   └── download.js      # Vercel Serverless Function（核心代理逻辑）
├── vercel.json          # Vercel 路由配置
└── package.json         # 项目信息
```

## 🚀 部署步骤

### 方式一：Vercel 网页部署（推荐）

1. **创建 GitHub 仓库**，上传本项目文件（`api/`、`vercel.json`、`package.json`）

2. **导入 Vercel**
   - 登录 [vercel.com](https://vercel.com)
   - 点击 **New Project** → Import 你的 GitHub 仓库
   - Framework Preset 选择 **Other**
   - 点击 **Deploy**

3. **绑定自定义域名**（可选但推荐）
   - 进入项目 → **Settings** → **Domains**
   - 添加你的自定义域名（如 `archive.xxx.com`）
   - 在 DNS 服务商处添加 CNAME 记录：
     - 主机记录：`archive`（或你想要的子域名）
     - 记录类型：`CNAME`
     - 记录值：`cname.vercel-dns.com`
   - 等待 DNS 生效

### 方式二：Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在项目目录下部署
cd archive-proxy
vercel --prod
```

## 🔧 使用说明

部署完成后，通过以下路径访问代理：

| 路径 | 代理目标 |
|------|---------|
| `/download/{path}` | `https://archive.org/download/{path}` |
| `/release/{id}/front-500` | `https://coverartarchive.org/release/{id}/front-500` |
| `/release-group/{id}/front-500` | `https://coverartarchive.org/release-group/{id}/front-500` |

### 示例

```bash
# 代理 archive.org 图片
https://你的域名/download/mbid-2f9b427d-cc6e-4465-9f70-9d2109381db0/xxx.jpg

# 代理 coverartarchive.org 封面
https://你的域名/release/2f9b427d-cc6e-4465-9f70-9d2109381db0/front-500
```

### 验证是否部署成功

访问以下地址，如果能显示图片说明部署成功：

```
https://你的域名/release/2f9b427d-cc6e-4465-9f70-9d2109381db0/front-500
```

## 🎵 在 MoviePilot 中使用

本项目常用于解决 MoviePilot 音乐探索封面不显示的问题。

1. 部署完成后，将代理域名（如 `https://archive.jgyun.top`）加入 MoviePilot 的图片域名白名单（`SECURITY_IMAGE_DOMAINS`）

2. 将音乐探索的封面 URL 前缀从 `https://coverartarchive.org` 改为 `https://你的域名`

3. 刷新音乐探索页面，封面即可正常显示

## ⚠️ 注意事项

- **Vercel 免费版限制**：免费版有约 100GB/月的带宽限制。音乐封面图片较小（约 70KB），一般够用。如果遇到限制，可考虑升级或使用 Cloudflare Workers（免费额度更高）。
- **缓存**：响应带 7 天缓存头，重复请求会命中缓存，减少回源。
- **仅支持 GET 请求**：代理只处理 GET 请求，其他方法返回 405。

## 📄 License

MIT License
