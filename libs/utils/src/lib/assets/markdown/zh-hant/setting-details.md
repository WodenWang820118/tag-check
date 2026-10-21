# 設定詳情

每個專案都有自己的設定，位於專案選單中的 **Settings**。在頁面上點選 **Save** 即可保留該頁的變更。

## Project Information

- **Project Name**：顯示在 Projects 頁面上的名稱。
- **Measurement ID**：網站傳送資料的目標 GA4 評估 ID。請求檢查會尋找傳送到此 ID 的 GA4 請求。
- **Project Description**：選填的備註。

## Pre-loading Values

TagCheck 在每次執行前設定的值，讓網站以測試所需的狀態開始：

- **Website URL**：受測網站。TagCheck 會在其網域上設定下方的 cookie。
- **Local Storage**：鍵與值的配對，例如網站保存在本機儲存空間中的同意聲明狀態。在執行所開啟的每個網頁中，TagCheck 會先於網頁的指令碼寫入這些配對。
- **Cookie**：名稱與值的配對，例如同意聲明 cookie。

若未取得同意，許多網站會封鎖分析代碼，兩項檢查都會失敗。

## Authentication

供位於 HTTP 驗證之後的網站使用的 **Username** 與 **Password**。TagCheck 會在網站要求時傳送它們。

## Google Tag Manager

- **Activate Accompanied Mode**：透過 GTM Preview 執行每個測試，讓受測代碼成為所預覽之工作區中的代碼。需要 Preview Mode URL。
- **Activate Request Check**：除了資料層之外也檢查 GA4 請求。需要評估 ID。
- **GTM URL**：容器工作區在 Tag Manager 中的網址，保存供參考。
- **Preview Mode URL**：你的預覽工作階段的 Tag Assistant 網址。在 Tag Manager 中啟動 **Preview**，並複製 Tag Assistant 顯示的網址；其中包含容器 ID 與網站，例如 `https://tagassistant.google.com/#/?id=GTM-XXXXXXX&url=https%3A%2F%2Fexample.com`。

## Browser Settings

- **Hide the browser?**：以無視窗模式執行 Chrome。Accompanied Mode 一律會顯示視窗。
- **Add browser setting**：為執行新增一個 Chrome 命令列參數，例如 `--window-size=1280,800`。

## Export or Delete

- **Export**：將專案連同其測試、規格、錄製與結果下載為 ZIP 檔案。在另一台電腦上，可透過 New Project 頁面的 **Already got the project?** 匯入。
- **Delete**：刪除專案及其中的所有內容。此操作無法復原。
