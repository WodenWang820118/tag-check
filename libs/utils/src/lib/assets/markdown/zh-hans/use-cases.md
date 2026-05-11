# 使用场景

Google Analytics 报表中的异常，往往就是标签问题的线索。例如 page view 突然明显下降，或某些事件出现 `(not set)` 参数，这些情况都可能来自 Google Tag Manager 中不正确的标签实现。通过审计，用户可以找出触发不准确的标签并进行修复。

TagCheck 特别适合以下场景：

- 拥有大量标签的大型网站
- 在 GTM 中有复杂自定义标签逻辑的网站
- 网站与 GTM 标签变动频繁的团队

## 搭配 GTM 的自动化

当系统提供 GTM shareable link 时，审计可以在 accompanied mode 下执行。审计进行时，另一个浏览器实例会打开 GTM Preview，让你同步观察标签的实时触发情况。

## 验证标签是否触发

这个场景下，用户希望找出完全没有触发的标签。标签依赖 data layer 内容，失败可能来自 trigger 设置问题，或标签本身实现不正确。

## 验证参数

根据量测规范，审计也可以检查标签是否带着正确参数触发。例如：

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

- `item_id` 只要求字段存在，不会比对实际值。`$item_id` 是一种 placeholder，方便在量测规划中引用这个值，也可以和其他参数例如 `$index` 一起使用
- `item_name` 必须符合 `switzerland` 或 `california` 的正则表达式
- `item_category` 必须精确等于 `Europe`
- `quantity` 必须是整数 `1`

## 找出假阳性的 request

在 GTM container 中，标签有时可能看起来已经正确实现，但实际发送到 Google Analytics 的数据并不符合预期。例如某个自定义事件带了数组类型参数，而 Google Analytics 并不支持这种形式。TagCheck 会拦截 request，并把信息重组为类似 data layer 的格式，再根据规范检查参数。例如：

```typescript
{
  event: 'remove_from_wishlist',
  ecommerce: {
    items: [
      {
        item_id: '$item_id',
        item_name: '^(?:switzerland|california)$',
        item_category: 'Europe',
        quantity: 1,
        price: 200
      }
    ],
    currency: 'USD',
    value: 200
  }
}
```

`remove_from_wishlist` 的 `items` 数组虽然会出现在 GTM Preview 中，但因为它不是 GA4 的推荐事件之一，Google Analytics 并不会真正收集这组 `items`。此时审计会将标签判定为失败，并说明原因。
