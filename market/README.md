# 插件索引

本目录存放 DSH 插件市场索引（format 1），入口是 `index.json`。

## 当前状态

- `index.json` 使用 npm 源，固定 `dsh-device-deck@0.6.0`。
- npm 包已发布，发布时间写入 `publishTimestamp`。
- 发布由 GitHub Actions OIDC 完成，不需要 npm token。
- 索引 URL：

  ```text
  https://raw.githubusercontent.com/zhouatie/dsh-device-deck/main/market/index.json
  ```

## 使用索引

1. 在 DSH 中启用 `@deepseek-ai/dsh-experimental-plugin-market-bundle`。
2. 打开**插件 → 发现 → 添加索引源**。
3. 粘贴上面的 URL。

也可以直接安装 npm 包：

```bash
dsh plugin --profile web add dsh-device-deck@0.6.0
```

## 更新版本

1. 按 [RELEASING.md](../RELEASING.md) 发布 npm 版本。
2. 查询发布时间：

   ```bash
   npm view dsh-device-deck time --json
   ```

3. 更新 `index.json` 的 `version`、`publishTimestamp` 与 `engines.dsh`。
4. 更新本文件顶部的当前版本与安装命令。
5. 提交并推送。

## 改用 Git 源

不想走 npm 时，把 `versions[0].source` 换成固定提交：

```json
{
  "type": "git",
  "url": "https://github.com/zhouatie/dsh-device-deck",
  "commit": "<40 位提交 SHA>"
}
```

每次推送新提交后更新 `commit`，否则市场仍安装旧版本。

## 注意

- 索引没有签名。标题、描述、作者与图标都是索引的声明。
- 每个列出的版本必须声明 `engines.dsh`，并与包清单一致。
- 索引 URL 不能经过重定向。请使用 `raw.githubusercontent.com`，不要用 `github.com/.../raw/...`。
- 当前市场没有升级操作，升级要先卸载再安装。
