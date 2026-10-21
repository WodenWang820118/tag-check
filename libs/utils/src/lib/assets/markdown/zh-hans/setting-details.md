# 设置详情

每个项目都有自己的设置，位于项目菜单的 **Settings** 下。在某个页面上选择 **Save**，即可保存该页面的更改。

## Project Information

- **Project Name**：显示在 Projects 页面上的名称。
- **Measurement ID**：网站发送数据的目标 GA4 测量 ID。请求检查会查找发送到该 ID 的 GA4 请求。
- **Project Description**：可选的备注。

## Pre-loading Values

TagCheck 在每次运行前设置的值，使网站以测试所需的状态启动：

- **Website URL**：被测网站。TagCheck 会在该网站的域名上设置下方的 Cookie。
- **Local Storage**：键值对，例如网站保存在本地存储中的用户同意状态。TagCheck 会在运行打开的每个页面的脚本执行之前写入这些键值对。
- **Cookie**：名称和值对，例如用户同意 Cookie。

如果没有用户同意，许多网站会阻止分析标签，两项检查都会失败。

## Authentication

用于受 HTTP 身份验证保护的网站的 **Username** 和 **Password**。TagCheck 会在网站要求时发送它们。

## Google Tag Manager

- **Activate Accompanied Mode**：通过 GTM 预览运行每个测试，因此被测的标签是所预览工作区中的标签。它需要 Preview Mode URL。
- **Activate Request Check**：在检查数据层的同时检查 GA4 请求。它需要测量 ID。
- **GTM URL**：该容器的工作区在 Tag Manager 中的地址，仅供参考。
- **Preview Mode URL**：您的预览会话的 Tag Assistant 地址。在 Tag Manager 中启动 **Preview**，然后复制 Tag Assistant 显示的地址；该地址包含容器 ID 和网站，例如 `https://tagassistant.google.com/#/?id=GTM-XXXXXXX&url=https%3A%2F%2Fexample.com`。

## Browser Settings

- **Hide the browser?**：在不显示窗口的情况下运行 Chrome。伴随模式始终会显示窗口。
- **Add browser setting**：为运行添加一个 Chrome 命令行参数，例如 `--window-size=1280,800`。

## Export or Delete

- **Export**：将项目及其测试、规格、录制和结果下载为 ZIP 文件。在另一台计算机上，可通过 New Project 页面上的 **Already got the project?** 导入它。
- **Delete**：删除该项目及其中的所有内容。此操作无法撤销。
