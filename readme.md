# 诗经植物图鉴

从《诗经》里的148种植物出发，阅读历代注疏、现代记载与古今图谱。网站沿用米白纸色、草木绿、楷体标题和古籍插图，提供植物目录、诗篇索引与全文检索三条阅读路径。

## 开发与验证

需要 Node.js 22 及以上版本：

```sh
npm ci
npm run dev
```

打开 <http://127.0.0.1:8000>。修改 `content/` 或 `web/` 后会自动重新构建，刷新浏览器即可查看。`PORT=8080 npm run dev` 可更换端口。

```sh
npm run build      # 生成可独立部署的 dist/
npm run preview    # 预览已有构建
npm test           # 构建、资料迁移回归、DOM交互与完整链接检查
npx playwright install chromium
npm run test:e2e   # 桌面与手机端到端测试
```

依赖仅用于开发、内容迁移与测试；生成的网站无需 Node.js 服务或第三方浏览器运行库。

## 目录

| 路径 | 用途 |
| --- | --- |
| `content/plants/*.json` | 植物内容的唯一编辑来源，一种植物一个文件 |
| `content/plant.schema.json` | 内容结构规范，配合编辑器检查字段 |
| `web/templates/` | 共享布局、导航、页面与首页内容 |
| `web/shared/` | 浏览器和构建共同使用的检索规则及安全渲染组件 |
| `web/client/` | 按页面加载的目录、检索与篇目增强模块 |
| `web/styles/` | 设计变量与响应式样式 |
| `pages/pic/`、`src/` | 保留路径的原始插图、字体与图标 |
| `scripts/` | 内容校验、构建、开发服务与迁移工具 |
| `tests/` | 内容回归、真实 DOM 测试与 Playwright 端到端测试 |
| `legacy/` | 重构前的网页与实现档案，不参与发布 |
| `dist/` | 自动生成的发布产物，不要直接编辑 |

## 内容维护

修改 `content/plants/001.json` 等文件。`poems` 存放出现篇目；`sections` 按原顺序保留章节和段落，`kind: "source"` 表示文献标题；`images` 保留图谱路径、来源说明和替代文本。正文是纯文本，标点、中文和文献出处应原样保留。

植物编号和 `url` 是稳定标识，不随显示名称修改。原来的 `pages/1艾.html` 和 `list.html#124` 等链接继续有效。原 HTML 只作为迁移核验档案，不再直接编辑。`scripts/migrate-content.mjs` 是一次性工具，拒绝覆盖已存在的内容文件。

`npm test` 会核对所有148条原始正文；如果有意增补或修订资料，请同时更新测试中对应的资料期望，并记录修订依据。原有缺失资料继续明确标注，不把「尚未收录」写成「原书无记载」。128个篇目来自现有植物记录，不是《诗经》完整目录。

## 发布

执行 `npm run build`，将 `dist/` 的全部内容上传至任意静态托管服务的网站根目录。保留中文文件名和目录结构，并将 `404.html` 配置为自定义404页面。只有 `dist/` 是发布目录；源资料、迁移档案和本地配置不应发布。

首页、植物详情、目录链接及篇目索引无需 JavaScript 即可阅读；全文检索和目录内切换需要浏览器模块及 HTTP 服务，不再支持直接双击源文件预览。

详细架构和设计约束见 [docs/architecture.md](docs/architecture.md)。

## GitHub Pages

本项目通过 GitHub Actions 发布到 <https://sj.oui.moe>，`master` 分支更新会自动触发构建。域名解析和 HTTPS 配置见 [docs/github-pages.md](docs/github-pages.md)。
