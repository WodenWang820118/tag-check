# 評估計畫

評估計畫定義了網站需要收集的事件與參數。在 TagCheck 中，評估計畫是數位行銷團隊與工程團隊之間的共同規範：Tag Build 將其轉換為 Google 代碼管理工具（GTM）容器，工程人員實作相應的 `dataLayer.push` 程式碼，而 TagCheck 則負責驗證網站是否正確推送了所需資料。

## 事件來源與命名規則

在規劃事件追蹤時，應先判斷使用者的各項操作是符合 Google 的建議事件，還是需要自訂事件。

### 建議事件與自訂事件

- **[Google 建議事件](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm)**：Google 針對線上銷售、待開發客戶開發、遊戲等常見產業情境定義了標準的事件名稱與參數名稱。使用建議名稱（例如 `purchase`、`add_to_cart`、`sign_up` 與 `generate_lead`）會自動在 GA4 中啟用內建維度、指標以及電子商務漏斗報表。
- **自訂事件**：若某個互動未列在 Google 建議清單中（例如使用互動式試算工具或選取特殊篩選條件），則可自訂事件名稱。自訂事件必須先在 GA4 中註冊自訂維度或指標，才能在標準報表中查看其參數值。

### 事件與參數命名規則

Google Analytics 4 對事件名稱與參數名稱設有嚴格的[命名規則](https://support.google.com/analytics/answer/13316687)：

- **可用字元**：事件名稱與參數名稱必須以英文字母開頭，且只能包含英文字母、數字和底線（`_`）。不能使用空格、連字號或句點。
- **長度限制**：事件名稱與參數名稱最多為 40 個字元。
- **大小寫區分**：事件名稱區分大小寫（`Purchase` 與 `purchase` 會被視為兩個不同的事件，建議一律使用小寫如 `purchase`）。
- **保留前綴與保留字**：參數名稱不可使用 `firebase_`、`ga_` 或 `google_` 作為前綴。此外，`event` 是資料層的保留關鍵字，不得用作事件參數名稱。

## 從計畫列到 TagCheck 驗證

評估計畫中的每一列都會經歷一致的五階段生命週期（以 `purchase` 事件為例）：

1. **計畫中的一列**：在計畫 CSV 中定義事件及其預期參數：
   - `event_name`: `purchase`
   - `event_parameters`: `transaction_id=/^T\d+$/, currency=TWD, value`
   - `item_parameters`: `item_id, item_name, price`
2. **網站發送的 `dataLayer.push`**：網站工程師將事件與電子商務資料推送到 `window.dataLayer`。電子商務事件須先清空先前的 `ecommerce` 物件：
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
3. **Tag Build 產生的 GTM 代碼**：Tag Build 將該計畫列轉換為由自訂事件 `purchase` 觸發的 GA4 事件代碼。對於電子商務事件，代碼會自動讀取資料層中的 `ecommerce` 物件。
4. **GA4 接收的內容**：當代碼在瀏覽器中觸發時，GTM 會向 Google Analytics 發送包含評估 ID（`&tid=...`）、事件名稱（`&en=purchase`）、事件參數（`&ep.currency=TWD`）與商品參數的 HTTP `/g/collect` 請求。
5. **TagCheck 檢查的內容**：在 Puppeteer 中重播使用者旅程時，TagCheck 執行兩項檢查：
   - **資料層檢查**：比對擷取到的 `dataLayer.push` 與計畫規格，驗證 `transaction_id` 符合規則運算式 `/^T\d+$/`、`currency` 等於 `'TWD'`、`value` 存在，且 `items` 包含所需屬性。
   - **請求檢查**：攔截發送給 GA4 的外發網路請求，確認 `/g/collect` 是否攜帶符合預期的事件載入正確抵達指定的評估 ID。

## 規則語法

評估計畫中的每個參數都可以設定一條驗證規則。TagCheck 會在重播期間依此進行核對：

| 規則形式       | 範例                         | 計畫語法                                 | TagCheck 認可的條件                                                                                                       |
| :------------- | :--------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **任意值**     | `currency` 或 `value`        | 僅填寫參數名稱（規格中為 `"$currency"`） | 僅要求資料層推送中包含該鍵；任何值（字串、數字或布林值）皆可通過。                                                        |
| **特定值**     | `currency=TWD` 或 `value=10` | 參數名稱後接 `=<值>`                     | 要求推送的值必須與預期值嚴格相等（`===`）。`value=10` 要求為數字，`in_stock=true` 要求為布林值，`level="10"` 要求為字串。 |
| **規則運算式** | `transaction_id=/^T\d+$/`    | 參數名稱後接 `=/<模式>/[旗標]`           | 要求推送的值為符合該規則運算式模式的字串。支援如 `i` 等旗標，模式中亦可包含逗號。                                         |

在驗證如 `ecommerce.items` 等陣列時，TagCheck 要求規格中所定義的每一項，在實際擷取的陣列中都至少有一項相符（順序不拘）。

## 交付工程團隊："For developers" 程式碼片段

為了便於向前端工程團隊交付規格，Tag Build 提供了 **For developers** 按鈕：

1. 在 Tag Build 中輸入或上傳評估計畫規格。
2. 點擊 **For developers** 開啟開發人員程式碼片段對話框。
3. Tag Build 會為每個事件建立完整、可直接複製的 JavaScript 程式碼：
   - 建議事件附上 Google 官方文件的定位連結。
   - 電子商務事件包含 `{ ecommerce: null }` 清除陳述式。
   - 根據參數名稱填入合理的範例值（貨幣為 `USD`、數值為 `0`、商品 ID 為 `SKU_123`、交易 ID 為 `T12345`）。
   - 為每個參數加上行內註解以說明驗證規則（`// must match /^T\d+$/`、`// must be "TWD"`、`// any value`）。
4. 點擊 **Copy all** 或 **Download (.js)**，即可將所有程式碼片段儲存為供開發團隊使用的 JavaScript 檔案。

## TagCheck 中的完整流程

TagCheck 將 Tag Build 直接整合至測試流程中：

- **Import into this project**：在 TagCheck 的 TagBuild 頁面中，當計畫通過轉換檢查後，點擊 **Import into this project**，即可將產生的 GTM 代碼、觸發條件與變數直接寫入目前專案的設定中。
- **Use this project's container**：在 **Tag Extract** 分頁中，TagCheck 可以讀取目前專案已儲存的容器，並將啟用的 GA4 代碼反向擷取為評估計畫 CSV。您可以下載擷取出的計畫、微調事件規則，然後重新上傳以完善追蹤規格。
