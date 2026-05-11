# 品質保證

品質保證的核心，是確認系統是否符合驗收條件。本文會一步步說明如何在平台上完成 QA 流程。

## 建立報告

在稽核測試案例之前，先建立可供參照的 report。由於同一個事件可能在多個位置被觸發，系統會為每一份報告建立 event ID。若你有兩個 `add_to_cart` 事件，第一個測試案例就需要先建立 JSON 規格，例如：

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

你之後仍可視需要編輯規格。事件名稱在系統中是唯一的，因此不能再新增另一份 `add_to_cart` 規格；其他測試案例會透過事件名稱共用這份規格，例如：

```json
{
  "event": "add_to_cart"
}
```

## 規格審查

同一個事件的量測規格應保持一致。當量測規劃一致時，Google Analytics 報表會更容易閱讀，也較不容易出現令人困惑的 `(not set)`。由於規格是全域共用的，修改規格可能影響其他測試案例。

## Chrome 錄製流程

Chrome Recorder 會記錄 CSS/ID selector、XPath 與其他定位資訊，用來描述每一步操作。常見動作包含點擊、滑過、輸入與選取。下載 Recorder 產生的 JSON 後，上傳到系統即可在稽核流程中使用。目前 TagCheck 主要以 CSS/ID selector 執行自動化。

## Google Tag Manager

Google Tag Manager 是一套資料收集工具，讓團隊能在不直接修改網站程式碼的情況下，聚焦在追蹤設計本身。TagCheck 的目標，就是減少重複的手動測試，並協助 QA 更穩定地對照商業需求驗證標記實作。

## Data layer

Data layer 是串接使用者互動與資料收集流程的 JavaScript 物件。例如，當使用者點擊按鈕時，data layer 會收到定義好的資料並觸發對應的 GTM 標記。因此，檢查 data layer 是確認實作品質的核心能力之一。

## Request 攔截

多數情況下，只檢查 data layer 已經足夠。不過有些情況在 GTM Preview 看起來正確，實際送到 Google Analytics 的值卻已被轉換，例如陣列被轉成字串。為了降低這類誤判，TagCheck 可以額外稽核外送 request。系統會依據專案中的 measurement ID 攔截 request，重建成類似 data layer 的物件，再以同一套驗證邏輯檢查它是否符合規格。

## GTM accompanied mode

GTM accompanied mode 讓你在自動化執行時，同步觀察 GTM Preview 中的標記觸發狀況，也適合用來檢查尚未發佈的 workspace。你需要提供 GTM container 的 shareable link 與落地頁網址，系統才會開啟預覽並執行稽核。
