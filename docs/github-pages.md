# GitHub Pages 与自定义域名

仓库：<https://github.com/Yulxon/shijing>

站点：<https://sj.oui.moe>

`master` 分支推送后，`.github/workflows/pages.yml` 会执行内容检查、构建并发布 `dist/`。GitHub 仓库的 **Settings → Pages → Build and deployment** 使用 **GitHub Actions**；**Custom domain** 设置为 `sj.oui.moe`。域名也记录在 `site.config.json`，构建时写入产物 `CNAME`；Actions 部署时真正生效的是 Pages 的 Custom domain 设置。

## DNS 配置

在管理 `oui.moe` 的 DNS 服务商控制台添加：

| 类型 | 主机记录 | 目标 | TTL |
| --- | --- | --- | --- |
| CNAME | `sj` | `yulxon.github.io` | 自动或300秒 |

目标不带 `https://`，也不带 `/shijing`。`sj` 这个名称不能同时配置冲突的 A、AAAA 或其他 CNAME 记录；不要改动根域名或其他子域名的记录。若使用 Cloudflare，先设为 **DNS only / 仅 DNS（灰云）**，让 GitHub 完成域名验证和证书签发。

DNS 生效后访问仓库的 **Settings → Pages**，确认域名检查通过并开启 **Enforce HTTPS**。如果该选项暂时不可用，等待证书签发后重试。可以用下面的命令核对解析：

```sh
dig +short CNAME sj.oui.moe
```

预期返回 `yulxon.github.io.`。DNS 和证书尚未就绪时，`https://sj.oui.moe` 不能视为已完成上线。

## 后续更新

保留原 Gitee 的 `origin`，GitHub 使用名为 `github` 的 SSH 远程：

```sh
git push github master
```

发布状态见仓库 **Actions → Deploy GitHub Pages**。完整构建结果通过后才会替换线上版本；本地配置、历史档案和内容源 JSON 不进入网站发布产物。

官方说明：<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>
