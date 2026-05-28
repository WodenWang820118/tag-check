# 设置

## 项目信息

项目信息区域可让你查看并编辑项目细节，例如项目名称、描述、measurement ID 与关联的 Google Sheet。

- Project Name：项目名称
- Description：项目描述
- Measurement ID：与项目关联的 Google Analytics measurement ID
- Google Sheet Link：与项目关联的 Google Sheet 链接

## 验证

当系统在执行测试前需要先登录时，可以在这里设置 HTTP authentication 所需的用户名与密码组合。

## Google Tag Manager

这个区域包含多项 GTM 相关设置。

- Request Interception

  这项功能会拦截 GTM container 发出的 request，将其重组为类似 data layer 的数据结构，并在详情页中保留 raw request 供检查。

- GTM Accompanied Mode

  这个模式会在审计过程中同步打开 GTM Preview，让你确认标签是否按预期触发，也适用于审计未发布的工作区。

- GTM URL and Shareable Link

  GTM URL 指向要检查的 workspace；shareable link 则是可分享给他人、用于预览相同 GTM container 配置的链接。

## Browser arguments

此区域包含两部分：

- Browser arguments

  可传给 Puppeteer 的高级浏览器参数，用来控制浏览器行为。

- Hide Browser

  可在后台执行测试时隐藏浏览器窗口。不过若启用 GTM Accompanied Mode，浏览器仍会保持可见。

## 预载数据

预载数据会在测试开始前先加载到应用中，尤其是 local storage 与 cookies。常见用途是预先加载 consent cookie，让 analytics 收集在自动化开始前就处于允许状态。

## Project IO

这项功能可让你导入与导出项目。项目数据会以 ZIP 文件格式传输。
