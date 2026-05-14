# 快速開始

TagCheck 能協助你統一量測規格，並將這些規格用於 GTM 相關網站或正式站點的標記驗證。

# 什麼是 Google Tag Manager

Google Tag Manager 是一套用來管理與部署行銷標記的工具。你可以在不修改網站或 App 原始碼的情況下，新增或更新追蹤碼、像素與其他標記，並把資料傳送到 Google Analytics、Facebook Pixel 等第三方服務。

# 什麼是 TagCheck

TagCheck 是一套協助你管理 Google Tag Manager（GTM）標記稽核專案的工具。你可以建立專案、加入標記，並執行稽核來確認標記是否在正確情境下被使用，或是否根本沒有被觸發。之後你可以根據結果回頭調整標記設定。

# 建立專案與第一個測試案例

每個專案都會有唯一的 project slug 作為識別，也可以填入後續在 Google Tag Manager 中會用到的專案資訊。開始自動化之前，有兩個必要條件：規格與錄製流程。

## 規格

規格使用 JSON 格式定義，例如：

```json
{
  "event": "page_view",
  "page_location": "$page_location",
  "page_referrer": "$page_referrer"
}
```

TagCheck 會依照幾種情境檢查欄位值：

- 以 `$` 開頭的字串：只驗證該欄位是否存在
- 靜態值：字串或數字。請注意，GA4 除了像 `items` 這類建議事件欄位外，不接受陣列物件
- 正規表示式：例如 `^(?:switzerland|california)$`

## GTM 標記設定

建立出的標記可以搭配 `TagBuild`，把規格轉成 GTM 可匯入的 JSON。轉換後，你可以直接貼到 GTM，或下載成 JSON 檔案。

## 錄製流程

錄製流程是來自 Chrome Recorder 的 JSON 檔案。目前 TagCheck 支援 CSS 與 ID selector，例如：

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
      "url": "https://gtm-integration-sample.netlify.app/"
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

請將檔案下載為 JSON，並上傳到 TagCheck，或直接將文字貼到編輯器中。

# 執行測試

表格右上角有一個播放按鈕。點擊後，系統會依照錄製流程與標記設定執行測試。測試執行時會同步顯示進度，而進度步數取決於錄製檔中的操作數量。例如：

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
      "url": "https://gtm-integration-sample.netlify.app/"
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

# 測試結果

測試完成後，結果會立即更新，主要分成 data layer 與 request 兩部分。

## Data layer

Data layer 是瀏覽器 `window` 物件底下的一個資料物件。Google Tag Manager 會利用並監看 data layer，把資料送往 Google Analytics 4。你可以透過 `window.dataLayer` 驗證網站是否在指定步驟中推送了約定好的資料。

## Request

當啟用 `Check Request` 並填入 measurement ID 後，TagCheck 會依照 measurement ID 與 event name 攔截請求，拆解 URL 參數，並重組成類似 data layer 的物件。例如：

'https://www.google-analytics.com/g/collect?v=2&tid=G-8HK542DQMG<br />&gtm=45je4410v9171567282z89168785492za200&\_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634<br />&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=<br />&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&\_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App<br />&en=add_to_cart&pr1=idcity001~ nmSwitzerland ~ lndestinations ~ caSwitzerland ~ qt1 ~ pr799&epn.value=799<br />&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&\_et=8682&tfd=30981'

會轉換成：

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

一個典型例子是 `add_to_wishlist`，它屬於 GA4 建議事件，因此 `items` 會被正確收集；但像 `remove_from_wishlist` 並不是建議事件，雖然 GTM Preview 仍會顯示 `items`，實際送往 Google Analytics 4 時卻不一定會保留。透過 request 檢查可以進一步確認實際送出的資料。

# 報告

每次測試執行後，系統都會自動產生報告，內容包含：

- Data layer specification：建立測試案例時定義的規格
- Actual data layer：瀏覽器 `window` 物件中的實際 data layer
- Request data layer：由網路請求重組出的 data layer
- Raw request：若有攔截到，可用來驗證資料是否真的送到 GA4
- Destination URL：事件觸發所在頁面的網址
- Screenshot：事件觸發時的畫面截圖

所有報告都可以從側邊欄的 reports 選單下載。
