# Youlong Chen — Academic Homepage

英文个人学术主页，使用 GitHub Pages 发布：

**https://ylchen-007.github.io/**

页面包含个人简介、研究方向、精选论文、开源贡献、研究数据、安全研究及联系方式。网页本身完全静态，不需要数据库、第三方字体、JavaScript 或付费服务。

## 更新内容

编辑根目录的 `site.config.mjs`：

- `introduction` / `researchStatement`：个人简介。
- `interests`：研究方向。
- `publications`：论文标题、完整作者、会议、状态和链接。
- `projects`：开源贡献及研究数据。
- `disclosures`：已公开的漏洞报告。
- `email`：联系邮箱。

视觉样式位于 `assets/style.css`，页面结构位于 `scripts/build.mjs`。

可以直接在 GitHub 网页中编辑这些文件并提交到 `main`。GitHub Actions 会构建、检查并自动更新网站，不需要手动上传 `dist/`。

## 本地预览

需要 Node.js 22 或更高版本，无须 `npm install`。

```sh
npm run build
npm run check
npm run preview
```

浏览器打开 http://127.0.0.1:4173 。修改后重新运行 `npm run build` 并刷新浏览器。按 Ctrl+C 结束预览。

## 发布配置

仓库：`YLChen-007/ylchen-007.github.io`。

GitHub 仓库 Settings → Pages → Build and deployment → Source 应选择 **GitHub Actions**。工作流为 `.github/workflows/pages.yml`，仅发布构建后的 `dist/`。

详情参见 [GitHub Pages 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 内容依据

姓名、单位及联系邮箱由本人提供。研究论文及公开贡献核实于 2026-11-04：

- HERMES / ASE 2026：[DOI](https://doi.org/10.1145/3832783.3834372)。完整作者以 DOI 元数据为准。
- THESEUS / CCS 2026：[会议官方议程](https://www.sigsac.org/ccs/CCS2026/program/schedule.html)。首版按 Accepted 标注。
- CloudStack：[已合并的 PR #12026](https://github.com/apache/cloudstack/pull/12026)。
- DCTaint：[公开研究数据仓库](https://github.com/YLChen-007/DCTaint)，页面仅标为研究数据。
- OpenClaw：[已修复安全公告](https://github.com/openclaw/openclaw/security/advisories/GHSA-v3qc-wrwx-j3pw)。

发布内容未包含本地完整简历、在投论文、手机号、住址或其他私人材料。后续添加文件时请只把希望公开的网页素材加入此仓库。
