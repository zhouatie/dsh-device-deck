# 设备台（Device Deck）

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

设备台是 DeepSeek Harness 的插件，把设备查看与操作放进 Harness Web UI。

它从 Android 设备镜像开始，后续会覆盖 Android、iOS 与 Web，并让 Agent 能够查看、操作与自动测试这些设备。

> 状态：alpha（`0.3.0`）。Android 镜像可用。iOS / Web 镜像与 AI E2E 测试在路线图中。

## 功能

### 已实现

- **会话头部设备菜单**：运行中的设备、未启动的 Android AVD、iOS 模拟器、无线 ADB 配对。
- **Android 镜像**：scrcpy 视频流，页面内 WebCodecs 解码。
- **自动息屏**：打开镜像后关闭物理显示面板，关闭镜像时恢复。
- **反向控制**：点击、滑动、返回、主页、最近任务、文本输入、打开链接或深链。
- **Android AVD 管理**：列出 AVD、无窗口启动、停止，就绪后打开镜像。
- **iOS 模拟器管理**：列出、启动、关闭，并打开 Simulator 或 Device Hub。
- **iOS 模拟器镜像**：与真机同一条 WebDriverAgent 链路，MJPEG 画面，支持点击、滑动、文本输入与截图。
  模拟器构建无需签名。
- **iOS 真机镜像**：用 `devicectl` 列出连接的 iPhone 与 iPad；通过 WebDriverAgent 推流 MJPEG 画面，
  支持点击、滑动、返回手势、文本输入、打开链接、主屏幕与截图。首次启动会自动构建 WebDriverAgent。
- **无线 ADB**：支持 `host` 或 `host:port`。
- **文件发送**：选择电脑上的文件，发送到当前设备的 `/sdcard/Download/`。
- **截图**：保存当前画面、浏览最近截图；从输入框的 `+` 菜单选择截图并加入输入框。
- **Agent 工具**：`device_screenshot` 返回选定截图。
- **快捷键**：`Ctrl+M` 打开或关闭镜像。

## 路线图

- Web 页面预览与控制。
- AI E2E 测试：规划、操作、等待、断言。
- 测试录制与回放。
- 多设备同屏。

路线图功能尚未实现，不代表当前可用。

## 环境要求

- 支持插件的 DeepSeek Harness。
- Host 侧 Node.js 20 或更高版本。
- Android：`adb`（Android platform-tools）。
- AVD 管理：Android SDK 的 `emulator`。
- iOS 模拟器：macOS 与 Xcode 命令行工具。
- iOS 真机：macOS、Xcode（含 iOS SDK）、`iproxy`（libimobiledevice），设备已开启开发者模式。
  Host 侧需在 Xcode 登录一个 Apple ID，用于自动签名。

插件已内置 `scrcpy-server` 3.3.3，无需单独安装 scrcpy。

## 安装

1. 克隆仓库：

   ```bash
   git clone https://github.com/zhouatie/dsh-device-deck.git
   cd dsh-device-deck
   ```

2. 安装依赖：

   ```bash
   pnpm install
   ```

3. 在 Harness 中把本目录安装为本地 bundle。入口：**设置 → 插件**，或使用插件管理器传入本目录的绝对路径。

4. 刷新一次 Harness 页面。

本地目录安装是链接方式。请保留目录，并在依赖变化后重新执行 `pnpm install`。

## 使用

1. 打开一个会话。
2. 点会话头部右上角的设备图标。
3. 选择运行中的 Android 设备打开镜像，或启动未运行的 AVD。
4. 镜像左侧操作列提供返回、主页、最近任务、文本输入、打开链接，以及截图、历史、重连、收起。历史在已有截图时出现。
   iOS 镜像的操作列提供返回手势、主屏幕、文本输入、打开链接、截图、历史、收起与停止会话。
5. 标题栏提供设备切换、连接状态与拖动区域。
6. 点输入框的 `+`，选“设备镜像截图”，再选一张截图。截图会加入输入框，可补充文字后发送。

发送文件：点左侧操作列的回形针，选择文件。文件会发送到当前设备的
`/sdcard/Download/<文件名>`。

无线 ADB 输入示例：

```text
192.168.1.102:5555
```

也可以只填主机名，默认补 `5555` 端口。

## 实现说明

- Host 侧注册 `/api/device-deck/*`，每台 Android 设备一个 scrcpy 会话。
- Host 打开 scrcpy 控制通道，镜像启动后关闭显示面板电源，最后一个镜像客户端
  离开时恢复。
- 视频通过同源分块 HTTP 传输，页面用 WebCodecs 解码。
- Client 侧注册到会话头部，渲染设备菜单与悬浮镜像。
- 截图保存在 `~/.dsh/device-deck/screenshots`。每台设备保留最近 30 张，选定的截图不删除。
- 文件上传会先写入 `~/.dsh/device-deck/uploads` 临时目录，再通过
  `adb push` 发送，完成后删除临时文件。
- 插件不依赖云端服务。设备命令走本地 `adb` 或 `xcrun`。只有你主动加入输入框并发送时，截图才会进入当前对话。

## 限制

- 镜像支持 Android 与 iOS 真机。iOS 模拟器只支持列表与启停。
- iOS 真机首次打开镜像会构建 WebDriverAgent，约 2–5 分钟。构建产物缓存于
  `~/.dsh/device-deck/wda`。
- iOS 真机签名使用 Xcode 当前登录的 Apple ID。免费账号的 Profile 7 天到期，到期后需重新构建。
- iOS 真机启动镜像时设备必须解锁并保持亮屏。建议把「自动锁定」设为「永不」，否则画面会切到锁屏。
- iOS 真机不支持息屏镜像。WebDriverAgent 没有屏幕电源控制接口，无法像 scrcpy 那样关闭物理屏。
- iOS 真机的返回用左边缘滑动手势模拟，只在支持该手势的页面生效。
- iOS 真机的打开链接依赖 WebDriverAgent 的 `/url` 接口，需要 iOS 16.4 或更高版本。更早版本回退 Siri，可能失败。
- 仅 H.264。H.265 设备会提示错误。
- 文本输入走 `adb shell input text`，仅支持 ASCII。
- 同一时间只镜像一台设备。
- iOS 模拟器镜像使用 WebDriverAgent，首次构建约 1 分钟。
- iOS 真机镜像依赖 WebDriverAgent，每台真机一个独立会话。
- 每次冷启动都会重新安装 WDA，约 10–40 秒。之后 10 分钟内重开镜像直接复用，不重装。
- Web 设备暂不支持。
- 文件发送一次一个，最大 2 GB，目标目录为 `/sdcard/Download`。
- 息屏依赖 scrcpy 的控制通道。部分厂商系统可能不支持。插件进程崩溃时，
  物理屏可能保持黑屏，按电源键恢复。

## 开发

```bash
pnpm install
pnpm check
```

`pnpm check` 使用 `node --check` 检查两个插件入口。

目录：

| 路径 | 用途 |
| --- | --- |
| `index.js` | Host 插件：路由、adb、scrcpy、截图、工具 |
| `client.js` | Client 插件：头部菜单、镜像、WebCodecs |
| `bin/scrcpy-server` | 内置 scrcpy server 3.3.3 |
| `cordis.patch.yml` | Bundle patch |
| `locale/` | 插件管理器的标题与描述 |

提交 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

插件代码：[MIT](LICENSE)。

内置的 scrcpy server 使用 Apache-2.0。见 [LICENSE-scrcpy](LICENSE-scrcpy) 与 [NOTICE](NOTICE)。

## English

[README.md](README.md)
