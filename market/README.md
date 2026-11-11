# 插件索引

本目录存放 DSH 插件市场索引（format 1），入口是 `index.json`。

## 当前状态

- `index.json` 使用 Git 源，固定到提交 `82892ae`。
- 不依赖 npm。别人现在可以把下面的 URL 添加为索引源：

  ```text
  https://raw.githubusercontent.com/zhouatie/dsh-device-deck/main/market/index.json
  ```

## 使用索引

1. 在 DSH 中启用 `@deepseek-ai/dsh-experimental-plugin-market-bundle`。
2. 打开**插件 → 发现 → 添加索引源**。
3. 粘贴上面的 URL。

发布前也可以直接用 GitHub 安装：

```bash
dsh plugin --profile web add github:zhouatie/dsh-device-deck
```

## 切换到 npm 源

1. 登录并发布：

   ```bash
   npm login
   npm publish
   ```

2. 查询实际发布时间：

   ```bash
   npm view dsh-device-deck time.0.3.0 --json
   ```

3. 把 `versions[0].source` 改成 `{ "type": "npm" }`，并把 `publishTimestamp` 改成实际时间。
4. 提交并推送。

## 更新版本

- Git 源：推送新提交后，把 `source.commit` 换成新的 40 位 SHA，`publishTimestamp` 换成提交时间。
- npm 源：发布新版本后，更新 `version` 与 `publishTimestamp`。
- 当前市场没有升级操作，升级要先卸载再安装。

## 注意

- 索引没有签名。标题、描述、作者与图标都是索引的声明。
- 每个列出的版本必须声明 `engines.dsh`，并与包清单一致。
- 索引 URL 不能经过重定向。请使用 `raw.githubusercontent.com`，不要用 `github.com/.../raw/...`。
