# 开始使用

本指南将带您从新建项目一直走到获得第一个结果。TagCheck 自带的示例项目针对 https://ng-gtm-sample.vercel.app 上的演示商店运行，其中每一步都已完成，可供参考。

## 1. 创建项目

在 **Projects** 页面上，选择 **New Project**（+），然后填写：

- **Project Name**：TagCheck 会据此生成项目 slug。
- **Measurement ID**：网站发送数据的目标 GA4 测量 ID，例如 `G-8HKQR5ZBSK`。请求检查需要用到它。
- **Project Description**：可选。

如需继续使用从 TagCheck 导出的项目，请在同一页面上使用 **Already got the project?** 并上传其 ZIP 文件。

## 2. 准备网站

打开项目并进入 **Settings**：

- **Pre-loading Values**：输入 **Website URL**，以及运行前网站所需的本地存储项和 Cookie。典型的例子是用户同意值，使网站允许其分析标签触发。
- **Google Tag Manager**：开启 **Activate Request Check**，以便在检查数据层的同时检查 GA4 请求。
- **Authentication**：如果网站受 HTTP 身份验证保护，请输入用户名和密码。

## 3. 添加测试

在 **Tests** 页面上，选择 **Add tests**（+）。共有三种方式：

- **Import GTM JSON**（推荐）：在 Tag Manager 中，前往 **Admin** > **Export container**，然后上传导出的文件。TagCheck 会为每个 GA4 事件标签创建一个测试。每个规格都会列出该标签从数据层变量中读取的参数，这些键必须存在于推送中。TagCheck 无法转换为测试的标签会列在 **Skipped tags** 下。
- **Import GA4 events**：上传或粘贴您计划推送的事件（单个 JSON 对象或数组），然后选择 **Create tests**。
- **Create a test manually**：在编辑器中编写规格并粘贴录制，然后选择 **Submit**。

## 4. 录制用户旅程

每个测试都会重放一个 Chrome Recorder 录制，该录制以推送其事件的操作结束。

1. 在 Chrome 中打开 DevTools 和 **Recorder** 面板，在您的网站上录制用户旅程：例如，打开一个商品页面并选择 **Add to cart**。
2. 将录制导出为 JSON 文件。
3. 打开测试并展开 **Spec, recording and item definition**。在 **Chrome Recording** 面板中，选择编辑按钮，通过 **Upload** 上传该文件或粘贴其内容，然后选择 **Save**。

TagCheck 可以重放 `setViewport`、`navigate`、`click`、`hover`、`change`、`keyDown`、`keyUp` 和 `waitForElement` 步骤，支持 CSS、ID、ARIA、文本、XPath 和 pierce 选择器；也会沿着选择器链进入 shadow root、在 iframe 里执行步骤，并在录制显示某个步骤会跳转页面时等待新页面出现。录制前，请把 Recorder 的 **Selector attribute** 设为 `data-testid`（或网站使用的测试属性），并保留所有选择器类型：稳定的选择器可以让录制在设计变更后依然有效。当某个步骤的选择器都对应不到元素时，TagCheck 会寻找唯一一个带有录制时 test hook、id 或名称的元素，用它继续执行，并在结果中注明（见报告管理）。

## 5. 运行测试

选择测试所在行末尾的播放按钮。进度图会随录制的步骤推进。如需停止运行，请选择工具栏中的 **Stop the running test**。

运行结束后，该行会显示新的状态。打开测试即可查看结果：各项检查、捕获的 `dataLayer`、GA4 请求、截图和录屏。**报告管理**会逐一解释每个部分。
