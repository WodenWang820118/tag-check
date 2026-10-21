# 使用案例

追蹤問題往往最先出現在 Google Analytics 中：網頁瀏覽量下降，或某個事件的參數顯示為 `(not set)`。這些問題通常來自改動了 `dataLayer` 的網站變更，或是弄壞了代碼的 GTM 變更。TagCheck 會直接在網站上檢查每個規劃好的事件，藉此找出這些問題。

TagCheck 適用於：

- 代碼眾多，或 GTM 設定經過大量客製化的網站；
- 經常發布網站或變更 GTM 的團隊；
- 電子商務網站，其事件所帶的商品與數值必須保持精確。

## 每次發布後檢查所有事件

匯入你的 GTM 容器，為每個 GA4 事件代碼建立一個測試，為每個測試加入錄製，並在每次發布後全部執行。測試表格會顯示哪些事件不再通過，Reports 頁面則會保留每次執行以供比較。

## 發布前先檢查工作區

Accompanied Mode 會透過 GTM Preview 執行測試，因此受測的代碼是你尚未發布之工作區中的代碼。你可以在 Tag Assistant 中觀察代碼觸發，同時由 TagCheck 檢查資料層與請求。

## 檢查參數，而不只是事件

規格會說明事件需要哪些參數，以及這些參數的值或模式。例如，以下規格要求一次 `add_to_cart` 推送，其中唯一的商品是 Switzerland 或 California，且價格與數量需與所列相符：

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "currency": "USD",
    "value": 200,
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "/^(?:Switzerland|California)$/",
        "item_category": "Europe",
        "quantity": 1,
        "price": 200
      }
    ]
  }
}
```

- `"$item_id"` 只要求 `item_id` 存在，不論其值為何。
- `"/^(?:Switzerland|California)$/"` 要求 `item_name` 符合兩個斜線之間的正規表示式。
- `"Europe"`、`1` 與 `200` 必須完全相符，包括型別：數字 `200` 不符合字串 `"200"`。

**品質保證**列出了所有規則。

## 抓出在傳往 GA4 途中改變的資料

GTM Preview 顯示的是代碼收到的內容，而不是 GA4 收到的內容。代碼可能遺漏某個參數、將事件傳送到其他評估 ID，或把陣列轉成字串。在這些情況下，資料層檢查仍會通過。請求檢查會將 GA4 請求本身與規格比對，因此測試會以 Partial 結束，而不會掩蓋其中的落差；結果也會保留原始請求供你檢視。
