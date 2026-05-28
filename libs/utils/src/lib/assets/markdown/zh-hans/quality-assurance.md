# 质量保证

质量保证的核心，是确认系统是否符合验收条件。本文会一步步说明如何在平台上完成 QA 流程。

## 创建报告

在审计测试用例之前，先创建可供参考的 report。由于同一个事件可能在多个位置被触发，系统会为每一份报告分配 event ID。当存在多个 `add_to_cart` 测试用例时，一份共享的 JSON 规范可置入所有用例。例如：

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "^(?:switzerland|california)$",
        "item_category": "Europe",
        "quantity": 1,
        "price": 200
      }
    ],
    "currency": "USD",
    "value": 200
  }
}
```

之后仍可按需要编辑规范。事件名称在系统中是唯一的，因此不能再新增另一份 `add_to_cart` 规范；其他测试用例会通过事件名称共用这份规范，例如：

```json
{
  "event": "add_to_cart"
}
```

## 规范审查

同一个事件的量测规范应保持一致。当量测规划一致时，Google Analytics 报表会更容易阅读，也较不容易出现令人困惑的 `(not set)`。由于规范是全局共享的，修改规范可能影响其他测试用例。

## Chrome 录制流程

Chrome Recorder 会记录 CSS/ID selector、XPath 与其他定位信息，用来描述每一步操作。常见动作包括点击、悬停、输入与选择。下载 Recorder 生成的 JSON 后，上传到系统即可在审计流程中使用。目前 TagCheck 主要以 CSS/ID selector 执行自动化。

## Google Tag Manager

Google Tag Manager 是一套代码管理系统，让团队能在不直接修改网站代码的情况下，专注于追踪设计本身。TagCheck 的目标，就是减少重复的手动测试，并协助 QA 更稳定地对照业务需求验证标签实现。

## Data layer

Data layer 是连接用户交互与数据收集流程的 JavaScript 对象。例如，当用户点击按钮时，data layer 会收到定义好的数据并触发对应的 GTM 标签。因此，检查 data layer 是确认实现质量的核心能力之一。

## Request 拦截

多数情况下，只检查 data layer 已经足够。不过有些情况在 GTM Preview 看起来正确，实际发送到 Google Analytics 的值却已经被转换，例如数组被转成字符串。为了降低这类误判，TagCheck 可以额外审计外发 request。系统会根据项目中的 measurement ID 拦截 request，重建为类似 data layer 的对象，再用同一套验证逻辑检查它是否符合规范。

## GTM accompanied mode

GTM accompanied mode 让你在自动化执行时，同步观察 GTM Preview 中的标签触发情况，也适合用来检查尚未发布的 workspace。你需要提供 GTM container 的 shareable link 与落地页 URL，系统才会打开预览并执行审计。
