/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages — emits plain HTML/CSS/JS to `out/`,
  // served straight from Cloudflare's CDN. No server runtime required.
  output: 'export',
  images: { unoptimized: true },
  // Produce directory-style URLs so Cloudflare Pages routes `/pricing`
  // to `/pricing/index.html` cleanly.
  trailingSlash: true,
}
module.exports = nextConfig
