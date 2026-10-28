# 衡量计划

衡量计划定义了网站需要收集的事件和参数。在 TagCheck 中，衡量计划是数字营销团队与研发团队之间的协作约定：Tag Build 将其转换为 Google 标签管理器（GTM）容器，开发人员实现相应的 `dataLayer.push` 代码，而 TagCheck 则用于审核网站是否正确推送了所需数据。

## 事件来源与命名规则

设计事件跟踪时，首先需要确定用户的每个操作是对应 Google 的推荐事件还是需要自定义事件。

### 推荐事件与自定义事件

- **[Google 推荐事件](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm)**：Google 针对在线销售、潜在客户挖掘、游戏等常见业务场景定义了标准事件名和参数名。使用推荐名称（例如 `purchase`、`add_to_cart`、`sign_up` 和 `generate_lead`）可直接在 GA4 中启用内置维度、指标以及电子商务漏斗报告。
- **自定义事件**：若某种交互无法归入 Google 推荐列表（例如使用互动计算器或选择特定的筛选条件），可定义自定义事件名称。自定义事件需要先在 GA4 中注册自定义维度或指标，才能在标准报告中查看其参数值。

### 事件与参数命名规则

Google Analytics 4 对事件名称和参数名称实施严格的[命名规则](https://support.google.com/analytics/answer/13316687)：

- **可用字符**：事件名称和参数名称必须以英文字母开头，且只能包含英文字母、数字和下划线（`_`）。不能使用空格、连字符或句点。
- **字符长度限制**：事件名称和参数名称最多不超过 40 个字符。
- **大小写敏感**：事件名称区分大小写（`Purchase` 与 `purchase` 会被视作两个不同的事件，建议统一使用小写如 `purchase`）。
- **保留前缀与保留字**：参数名称不能以 `firebase_`、`ga_` 或 `google_` 开头。此外，`event` 是数据层的保留字段，不可用作事件参数名。

## 从计划行到 TagCheck 验证

衡量计划中的每一行都会经历统一的五个阶段生命周期（以 `purchase` 事件为例）：

1. **计划中的一行**：在计划 CSV 中定义事件及预期参数：
   - `event_name`: `purchase`
   - `event_parameters`: `transaction_id=/^T\d+$/, currency=TWD, value`
   - `item_parameters`: `item_id, item_name, price`
2. **网站发送的 `dataLayer.push`**：网站开发人员将事件和电子商务数据推送到 `window.dataLayer`。对于电子商务事件，应先清空先前的 `ecommerce` 对象：
   ```javascript
   window.dataLayer = window.dataLayer || [];
   window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object
   window.dataLayer.push({
     event: 'purchase',
     ecommerce: {
       transaction_id: 'T12345',
       currency: 'TWD',
       value: 1200,
       items: [{ item_id: 'SKU_123', item_name: 'Example', price: 1200 }]
     }
   });
   ```
3. **Tag Build 生成的 GTM 代码**：Tag Build 将该计划行转换为由自定义事件 `purchase` 触发的 GA4 事件代码。对于电子商务事件，代码会自动读取数据层中的 `ecommerce` 对象。
4. **GA4 接收的内容**：当代码在浏览器中触发时，GTM 会向 Google Analytics 发送包含测量 ID（`&tid=...`）、事件名称（`&en=purchase`）、事件参数（`&ep.currency=TWD`）以及商品参数的 HTTP `/g/collect` 请求。
5. **TagCheck 检查的内容**：在 Puppeteer 中重放用户旅程时，TagCheck 执行两项检查：
   - **数据层检查**：比对捕获到的 `dataLayer.push` 与计划规格，验证 `transaction_id` 符合正则表达式 `/^T\d+$/`、`currency` 等于 `'TWD'`、`value` 存在，且 `items` 包含所需属性。
   - **请求检查**：拦截发送给 GA4 的外发网络请求，核实 `/g/collect` 是否以符合预期的事件载荷到达指定的测量 ID。

## 规则语法

衡量计划中的每个参数都可以包含一条验证规则。TagCheck 会在重放期间核对这些规则：

| 规则形式       | 示例                         | 计划语法                               | TagCheck 接受的条件                                                                                                     |
| :------------- | :--------------------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **任意值**     | `currency` 或 `value`        | 仅填写参数名（规格中为 `"$currency"`） | 仅要求数据层推送中包含该键；任何值（字符串、数字或布尔值）均可通过。                                                    |
| **特定值**     | `currency=TWD` 或 `value=10` | 参数名后接 `=<值>`                     | 要求推送的值与预期值严格相等（`===`）。`value=10` 要求为数字，`in_stock=true` 要求为布尔值，`level="10"` 要求为字符串。 |
| **正则表达式** | `transaction_id=/^T\d+$/`    | 参数名后接 `=/<模式>/[标志]`           | 要求推送的值为符合该正则表达式模式的字符串。支持如 `i` 等标志，模式中亦可包含逗号。                                     |

在验证如 `ecommerce.items` 等数组时，TagCheck 要求规格中定义的每一项都在实际捕获的数组中至少匹配一项（顺序不限）。

## 向开发人员交付："For developers" 代码片段

为了使向 Web 开发团队的交付更为顺畅，Tag Build 提供了 **For developers** 按钮：

1. 在 Tag Build 中输入或上传衡量计划规格。
2. 点击 **For developers** 打开开发者代码片段对话框。
3. Tag Build 会为每个事件生成完整、可直接复制的 JavaScript 代码：
   - 为推荐事件附上 Google 官方文档锚点链接。
   - 为电子商务事件包含 `{ ecommerce: null }` 清空语句。
   - 根据参数名称填充现实的占位示例值（货币为 `USD`、数值为 `0`、商品 ID 为 `SKU_123`、交易 ID 为 `T12345`）。
   - 为每个参数添加行内注释说明其验证规则（`// must match /^T\d+$/`、`// must be "TWD"`、`// any value`）。
4. 点击 **Copy all** 或 **Download (.js)**，将所有代码片段保存为供工程团队使用的 JavaScript 文件。

## TagCheck 中的完整流程

TagCheck 将 Tag Build 直接整合到了测试流程中：

- **Import into this project**：在 TagCheck 内的 TagBuild 页面中，当衡量计划通过转换检查后，点击 **Import into this project**，即可将生成的 GTM 代码、触发器和变量直接写入当前项目的配置中。
- **Use this project's container**：在 **Tag Extract** 标签页中，TagCheck 可以读取当前项目已保存的容器，并将处于启用状态的 GA4 代码逆向提取为衡量计划 CSV。您可以下载提取出的计划、调整事件规则，然后再上传以完善跟踪规格。
