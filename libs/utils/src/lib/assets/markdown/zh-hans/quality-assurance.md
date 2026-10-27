# 质量保证

当网站和 GTM 发送的内容与测试规格的描述一致时，测试即通过。本页介绍如何编写规格、两项检查如何与规格进行比较，以及如何在发布标签之前审查标签。

## 编写规格

规格是您期望的 `dataLayer` 推送，以 JSON 编写。其中 `event` 指定 GA4 事件名称，其他每个键都是推送必须包含的参数。规格中未列出的键会被忽略，因此规格只需包含您关心的参数。

值遵循以下规则：

| 规格值                                     | 通过条件                                           |
| ------------------------------------------ | -------------------------------------------------- |
| `"$name"`，例如 `"$item_id"`               | 该键存在，不论其值为何                             |
| `"{{Variable Name}}"`，即 Tag Manager 变量 | 该键存在，不论其值为何                             |
| `"/pattern/"`                              | 该值是与两个斜杠之间的正则表达式匹配的字符串       |
| 任何其他字符串、数字或布尔值               | 该值完全相等，包括类型                             |
| 对象，例如 `ecommerce`                     | 其每个键都按相同规则通过                           |
| 数组，例如 `items`                         | 每个条目都至少与实际数组中的一个条目匹配，顺序不限 |

例如：

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "currency": "USD",
    "value": "$value",
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "/^(?:Switzerland|California)$/",
        "quantity": 1
      }
    ]
  }
}
```

数字 `1` 与字符串 `"1"` 不匹配。当网站推送的是数字时，请将其写为数字。

从 GTM 容器导入的测试，其初始规格根据标签生成：每个读取数据层变量的参数都会成为一个键，其值为变量引用，例如 `"value": "{{DLV - ecommerce.value}}"`，因此该键必须存在。如需更严格的检查，请将引用替换为值或模式。要编辑规格，请打开测试，展开 **Spec, recording and item definition**，然后使用 **Data Layer Spec** 面板的编辑按钮。

## 电子商务事件

对于 Google 推荐的电子商务事件，以及任何包含 `ecommerce.items` 的规格，数据层检查还要求在该事件之前先推送 `{ ecommerce: null }`，这是 Google 为清除之前的电子商务数据而推荐的做法（[使用 Tag Manager 衡量电子商务](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm)）。请求检查会跳过这条规则，因为这次重置从不离开浏览器。

测试还可以有一个 **Item Definition**：一个 GA4 商品，例如：

```json
{
  "item_id": "city001",
  "item_name": "Switzerland",
  "item_category": "Switzerland",
  "quantity": 1,
  "price": 799
}
```

对于电子商务事件，运行随后会期望 `ecommerce.items` 中的条目为该商品，以取代规格中的商品。请在测试页面 **Spec, recording and item definition** 中的 **Item Definition** 面板里编辑它。

## 请求检查

开启 **Activate Request Check** 后，TagCheck 会拦截发送到项目测量 ID 的、该测试事件的 GA4 请求。它从请求中读取事件名称、事件参数和商品，将它们重建为一个结构与 `dataLayer` 推送相同的对象，然后应用同一规格。Google 并未公开该请求格式的文档；TagCheck 按照 gtag.js 实际发送的方式读取它。

重建后的对象保留请求所携带的类型：数值型事件参数（`epn.`）和数值型商品字段（例如 `price` 和 `quantity`）会成为数字；其他事件参数（`ep.`）保持为字符串。如果标签将数字作为文本参数发送，规格值 `200` 会通过数据层检查，但在请求检查中会因 `"200"` 而失败。请修复标签，或者在类型无关紧要的地方使用 `"$value"` 或模式。

## 审查标签

测试的 **Tag Snapshot** 选项卡显示该测试所来源的 GA4 事件标签：

- **Measurement ID**：标签发送数据的目标 ID。当标签引用常量变量（例如 `{{CONST - Measurement ID}}`）时，该选项卡会显示常量的值，并在其下方显示该引用。
- **Event Name** 和 **Event Parameters**：标签发送的参数，包括来自其事件设置变量的参数。读取数据层变量的值会显示其读取的数据层键，例如 `Data layer: ecommerce.value`。
- **Triggering**：标签的触发器。

将其与规格进行比较，即可判断标签读取的是否为网站推送的键。

## 伴随模式

伴随模式通过 GTM 预览运行测试，因此被测的标签是您正在预览的工作区中的标签，即使尚未发布也是如此。如需使用，请在 **Google Tag Manager** 设置中输入 **Preview Mode URL**，并开启 **Activate Accompanied Mode**。运行会在网站旁边打开 Tag Assistant，并且浏览器窗口在运行结束后会保持打开状态以供检查；用完后请将其关闭。
