import { escapeHTML as e } from '../shared/render.mjs';
export function navigation(active = '', base = '', embedded = false) {
    const target = embedded ? ' target="_top"' : '';
    return `<header class="site-header"><a class="brand" href="${base}index.html"${target}><img src="${base}src/icon.png" alt="" width="44" height="44"><span><strong>诗经植物图鉴</strong><small>THE BOTANY OF SHIJING</small></span></a><nav aria-label="主导航">${[['index.html', '首页'], ['list.html', '诗经植物'], ['shijing.html', '诗经篇目'], ['search.html', '植物检索']].map(([url, label]) => `<a href="${base}${url}"${active === url ? ' aria-current="page"' : ''}${target}>${label}</a>`).join('')}</nav></header>`;
}
export function layout({ title, description, active = '', base = '', body, script = '', bodyClass = '' }) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${e(description)}">
    <meta name="theme-color" content="#f7f6ef">
    <title>${e(title)} · 诗经植物图鉴</title>
    <link rel="icon" href="${base}src/icon.png">
    <link rel="stylesheet" href="${base}assets/styles/main.css">
    ${script ? `<script type="module" src="${base}assets/client/${script}.mjs"></script>` : ''}
</head>
<body class="${e(bodyClass)}">
<a class="skip-link" href="#main">跳至主要内容</a>
${navigation(active, base)}
<main class="container" id="main">${body}</main>
<footer class="site-footer"><span>诗经植物图鉴 · 让古籍中的植物鲜活起来</span><a href="mailto:perfectymx@foxmail.com">联系我们 ↗</a></footer>
</body>
</html>
`;
}
