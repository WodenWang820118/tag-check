# 快速上手

本指南會帶你從建立新專案一路走到第一個結果。TagCheck 隨附的範例專案會針對位於 https://ng-gtm-sample.vercel.app 的示範商店執行，並展示每個步驟都已完成的樣貌。

## 1. 建立專案

在 **Projects** 頁面點選 **New Project**（+），並填寫：

- **Project Name**：TagCheck 會據此產生專案的 slug。
- **Measurement ID**：網站傳送資料的目標 GA4 評估 ID，例如 `G-8HKQR5ZBSK`。請求檢查需要用到它。
- **Project Description**：選填。

若要繼續使用從 TagCheck 匯出的專案，請在同一頁使用 **Already got the project?** 並上傳其 ZIP 檔案。

## 2. 準備網站

開啟專案並前往 **Settings**：

- **Pre-loading Values**：輸入 **Website URL**，以及執行前網站所需的本機儲存空間項目與 cookie。典型的例子是同意聲明值，讓網站允許其分析代碼觸發。
- **Google Tag Manager**：開啟 **Activate Request Check**，除了資料層之外也檢查 GA4 請求。
- **Authentication**：如果網站位於 HTTP 驗證之後，請輸入使用者名稱與密碼。

## 3. 新增測試

在 **Tests** 頁面點選 **Add tests**（+）。共有三種方式：

- **Import GTM JSON**（建議）：在 Tag Manager 中前往 **Admin** > **Export container**，然後上傳該檔案。TagCheck 會為每個 GA4 事件代碼建立一個測試。每份規格會列出代碼從資料層變數讀取的參數，這些鍵必須存在於推送中。TagCheck 無法轉換成測試的代碼會列在 **Skipped tags** 之下。
- **Import GA4 events**：上傳或貼上你規劃推送的事件（可以是單一 JSON 物件或陣列），然後點選 **Create tests**。
- **Create a test manually**：在編輯器中撰寫規格並貼上錄製，然後點選 **Submit**。

## 4. 錄製旅程

每個測試都會重播一份 Chrome Recorder 錄製，其最後一個動作會推送該測試的事件。

1. 在 Chrome 中開啟 DevTools 與 **Recorder** 面板，然後在你的網站上錄製旅程：例如開啟商品頁面並點選 **Add to cart**。
2. 將錄製匯出為 JSON 檔案。
3. 開啟測試並前往 **Latest result**。在 **Chrome Recording** 面板中點選編輯按鈕，使用 **Upload** 上傳該檔案或貼上其內容，然後點選 **Save**。

TagCheck 會重播 `setViewport`、`navigate`、`click`、`hover`、`change`、`keyDown`、`keyUp` 與 `waitForElement` 步驟，並支援 CSS、ID、ARIA、文字、XPath 與 pierce 選取器。穩定的選取器（例如 `data-testid` 屬性）能讓錄製在設計變更後仍然有效。

## 5. 執行測試

點選測試列末端的播放按鈕。進度圖表會隨著錄製的步驟推進。若要停止執行，請點選工具列中的 **Stop the running test**。

執行結束後，該列會顯示新的狀態。開啟測試即可查看結果：各項檢查、擷取到的 `dataLayer`、GA4 請求、螢幕截圖與螢幕錄影。**報表管理**會說明每個部分。
