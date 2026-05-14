# 使用情境

Google Analytics 報表中的異常，往往就是標記問題的線索。例如 page view 突然明顯下降，或某些事件出現 `(not set)` 參數，這些情況都可能來自 Google Tag Manager 內不正確的標記實作。透過稽核，使用者可以找出觸發不準確的標記並加以修正。

TagCheck 特別適合以下情境：

- 具有大量標記的大型網站
- 在 GTM 中有複雜自訂標記邏輯的網站
- 網站與 GTM 標記變動頻繁的團隊

## 搭配 GTM 的自動化

當系統提供 GTM shareable link 時，稽核可以在 accompanied mode 下執行。稽核進行時，另一個瀏覽器實例會開啟 GTM Preview，讓你能同步觀察標記的即時觸發狀況。

## 驗證標記是否觸發

這個情境下，使用者想找出完全沒有觸發的標記。標記依賴 data layer 內容，失敗可能來自 trigger 設定問題，或標記本身實作不正確。

## 驗證參數

根據量測規格，稽核也可以檢查標記是否帶著正確參數觸發。例如：

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

- `item_id` 只要求欄位存在，不會比對實際值。`$item_id` 是一種 placeholder，方便在量測規劃中引用這個值，也可以和其他參數例如 `$index` 一起使用
- `item_name` 必須符合 `switzerland` 或 `california` 的正規表示式
- `item_category` 必須精確等於 `Europe`
- `quantity` 必須是整數 `1`

## 找出假陽性的 request

在 GTM container 中，標記有時可能看起來已正確實作，但實際送往 Google Analytics 的資料並不符合預期。例如某個自訂事件帶了陣列型別參數，而 Google Analytics 並不支援這種形式。TagCheck 會攔截 request，並把資訊重組成類似 data layer 的格式，再根據規格檢查參數。例如：

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

`remove_from_wishlist` 的 `items` 陣列雖然會出現在 GTM Preview 中，但因為它不是 GA4 的建議事件之一，Google Analytics 不會真正收集這組 `items`。此時稽核會將標記判定為失敗，並說明原因。
