# 快速开始

TagCheck 可以帮助你统一量测规范，并将这些规范用于 GTM 相关网站或正式站点的标签验证。

## 什么是 Google Tag Manager

Google Tag Manager 是一套用来管理和部署营销标签的工具。你可以在不修改网站或 App 源代码的情况下，新增或更新追踪代码、像素与其他标签，并把数据发送到 Google Analytics、Facebook Pixel 等第三方服务。

## 什么是 TagCheck

TagCheck 是一套帮助你管理 Google Tag Manager（GTM）标签审计项目的工具。你可以创建项目、加入标签，并执行审计来确认标签是否在正确场景下被使用，或是否根本没有被触发。之后你可以根据结果调整标签配置。

## 创建项目与第一个测试用例

每个项目都会有唯一的 project slug 作为识别，也可以填写后续在 Google Tag Manager 中会用到的项目信息。开始自动化之前，有两个必要条件：规范与录制流程。

## 规范

规范使用 JSON 格式定义，例如：

```json
{
  "event": "page_view",
  "page_location": "$page_location",
  "page_referrer": "$page_referrer"
}
```

TagCheck 会根据几种场景检查字段值：

- 以 `$` 开头的字符串：只验证该字段是否存在
- 静态值：字符串或数字。请注意，GA4 除了像 `items` 这类推荐事件字段外，不接受数组对象
- 正则表达式：例如 `^(?:switzerland|california)$`

## GTM 标签配置

创建好的标签可以配合 `TagBuild`，把规范转换为 GTM 可导入的 JSON。转换后，你可以直接粘贴到 GTM，或下载为 JSON 文件。

## 录制流程

录制流程是来自 Chrome Recorder 的 JSON 文件。目前 TagCheck 支持 CSS 和 ID selector，例如：

```json
{
  "title": "add_to_cart",
  "steps": [
    {
      "type": "setViewport",
      "width": 1737,
      "height": 1100,
      "deviceScaleFactor": 1,
      "isMobile": false,
      "hasTouch": false,
      "isLandscape": false
    },
    {
      "type": "navigate",
      "url": "https://ng-gtm-sample.vercel.app/home"
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["div.active img"]],
      "offsetY": 44.42852783203125,
      "offsetX": 344.60711669921875
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["app-details button"]],
      "offsetY": 22.705322265625,
      "offsetX": 67.1070556640625
    }
  ]
}
```

请将文件下载为 JSON，并上传到 TagCheck，或者直接把文本粘贴到编辑器中。

## 执行测试

表格右上角有一个播放按钮。点击后，系统会根据录制流程与标签配置执行测试。测试执行时会同步显示进度，而进度步数取决于录制文件中的操作数量。例如：

```json
{
  "title": "add_to_cart",
  "steps": [
    {
      "type": "setViewport",
      "width": 1737,
      "height": 1100,
      "deviceScaleFactor": 1,
      "isMobile": false,
      "hasTouch": false,
      "isLandscape": false
    },
    {
      "type": "navigate",
      "url": "https://ng-gtm-sample.vercel.app/home"
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["div.active img"]],
      "offsetY": 44.42852783203125,
      "offsetX": 344.60711669921875
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["app-details button"]],
      "offsetY": 22.705322265625,
      "offsetX": 67.1070556640625
    }
  ]
}
```

## 测试结果

测试完成后，结果会立即更新，主要分成 data layer 与 request 两部分。

## Data layer

Data layer 是浏览器 `window` 对象下的一个数据对象。Google Tag Manager 会利用并监听 data layer，把数据发送到 Google Analytics 4。你可以通过 `window.dataLayer` 验证网站是否在指定步骤中推送了约定好的数据。

## Request

当启用 `Check Request` 并填入 measurement ID 后，TagCheck 会根据 measurement ID 与 event name 拦截请求，拆解 URL 参数，并重组成类似 data layer 的对象。例如：

'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK<br />&gtm=45je4410v9171567282z89168785492za200&\_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634<br />&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=<br />&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&\_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App<br />&en=add_to_cart&pr1=idcity001~ nmSwitzerland ~ lndestinations ~ caSwitzerland ~ qt1 ~ pr799&epn.value=799<br />&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&\_et=8682&tfd=30981'

会转换成：

```json
{
  "event": "add_to_cart",
  "creative_name": "travel_slide",
  "creative_slot": "featured_attributor",
  "promotion_id": "city001",
  "promotion_name": "Switzerland",
  "ecommerce": {
    "value": "799",
    "currency": "USD",
    "items": [
      {
        "item_id": "city001",
        "item_name": "Switzerland",
        "item_category": "Switzerland",
        "price": "799",
        "quantity": "1"
      }
    ]
  }
}
```

一个典型例子是 `add_to_wishlist`，它属于 GA4 推荐事件，因此 `items` 会被正确收集；但像 `remove_from_wishlist` 并不是推荐事件，虽然 GTM Preview 仍会显示 `items`，实际发送到 Google Analytics 4 时却不一定会保留。通过 request 检查可以进一步确认真实发送的数据。

## 报告

每次测试执行后，系统都会自动生成报告，内容包括：

- Data layer specification：创建测试用例时定义的规范
- Actual data layer：浏览器 `window` 对象中的实际 data layer
- Request data layer：由网络请求重组出的 data layer
- Raw request：如果有拦截到，可用于验证数据是否真的发送到 GA4
- Destination URL：事件触发所在页面的网址
- Screenshot：事件触发时的画面截图

所有报告都可以从侧边栏的 Reports 菜单下载。
