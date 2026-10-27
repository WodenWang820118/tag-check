# 品質保證

當網站與 GTM 送出的內容符合規格的描述時，測試就會通過。本頁說明如何撰寫規格、兩項檢查如何比對規格，以及如何在發布代碼前先審查它。

## 撰寫規格

規格就是你預期的 `dataLayer` 推送，以 JSON 撰寫。其中 `event` 指定 GA4 事件名稱，其他每個鍵都是推送必須包含的參數。規格沒有列出的鍵會被忽略，因此規格只需要包含你在意的參數。

值遵循以下規則：

| 規格值                                     | 通過條件                                         |
| ------------------------------------------ | ------------------------------------------------ |
| `"$name"`，例如 `"$item_id"`               | 鍵存在，不論其值為何                             |
| `"{{Variable Name}}"`，即 Tag Manager 變數 | 鍵存在，不論其值為何                             |
| `"/pattern/"`                              | 值是符合兩個斜線之間正規表示式的字串             |
| 其他任何字串、數字或布林值                 | 值完全相等，包括型別                             |
| 物件，例如 `ecommerce`                     | 物件中的每個鍵都依相同規則通過                   |
| 陣列，例如 `items`                         | 每個元素都至少符合實際陣列中的一個元素，順序不拘 |

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

數字 `1` 不符合字串 `"1"`。網站推送數字時，請在規格中寫成數字。

從 GTM 容器匯入的測試，一開始的規格是依代碼建立的：每個讀取資料層變數的參數都會成為一個鍵，其值為該變數的參照，例如 `"value": "{{DLV - ecommerce.value}}"`，因此該鍵必須存在。在你想要更嚴格檢查的地方，請將參照替換為值或模式。若要編輯規格，請開啟測試，展開 **Spec, recording and item definition**，並使用 **Data Layer Spec** 面板的編輯按鈕。

## 電子商務事件

對於 Google 建議的電子商務事件，以及任何含有 `ecommerce.items` 的規格，資料層檢查還會要求事件之前先有一次 `{ ecommerce: null }` 推送；Google 建議以此清除先前的電子商務資料（[使用 Tag Manager 評估電子商務](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm)）。請求檢查會略過這條規則，因為這次重設不會離開瀏覽器。

測試也可以有一份 **Item Definition**：一個 GA4 商品，例如：

```json
{
  "item_id": "city001",
  "item_name": "Switzerland",
  "item_category": "Switzerland",
  "quantity": 1,
  "price": 799
}
```

如此一來，對於電子商務事件，執行會預期 `ecommerce.items` 的元素就是這個商品，取代規格中的商品。請在測試頁面 **Spec, recording and item definition** 中的 **Item Definition** 面板編輯它。

## 請求檢查

開啟 **Activate Request Check** 後，TagCheck 會攔截測試事件傳送到專案評估 ID 的 GA4 請求。它會從請求中讀取事件名稱、事件參數與商品，將它們重組成形狀類似 `dataLayer` 推送的物件，然後套用同一份規格。Google 並未提供請求格式的說明文件；TagCheck 依照 gtag.js 實際送出的格式來讀取。

重組後的物件會保留請求所帶的型別：數值事件參數（`epn.`）與數值商品欄位（例如 `price` 和 `quantity`）會成為數字；其他事件參數（`ep.`）則維持字串。如果代碼把數字當成文字參數送出，規格值 `200` 會通過資料層檢查，但請求檢查會因為 `"200"` 而失敗。請修正代碼，或在型別無關緊要的地方使用 `"$value"` 或模式。

## 審查代碼

測試的 **Tag Snapshot** 分頁會顯示該測試所來自的 GA4 事件代碼：

- **Measurement ID**：代碼傳送的目標 ID。當代碼參照常數變數（例如 `{{CONST - Measurement ID}}`）時，此分頁會顯示該常數的值，並在其下方顯示參照。
- **Event Name** 與 **Event Parameters**：代碼傳送的參數，包括來自其事件設定變數的參數。讀取資料層變數的值，會顯示它所讀取的資料層鍵，例如 `Data layer: ecommerce.value`。
- **Triggering**：代碼的觸發條件。

將它與規格比較，即可看出代碼是否讀取了網站推送的鍵。

## Accompanied Mode

Accompanied Mode 會透過 GTM Preview 執行測試，因此受測代碼是你所預覽之工作區中的代碼，即使尚未發布也一樣。若要使用此模式，請在 **Google Tag Manager** 設定中輸入 **Preview Mode URL**，並開啟 **Activate Accompanied Mode**。執行時會在網站旁開啟 Tag Assistant，執行結束後瀏覽器視窗會保持開啟以供檢查；完成後請將它關閉。
