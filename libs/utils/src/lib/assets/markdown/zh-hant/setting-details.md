# 設定

## 專案資訊

專案資訊區塊可讓你檢視並編輯專案細節，例如專案名稱、描述、measurement ID 與連結的 Google Sheet。

- Project Name：專案名稱
- Description：專案描述
- Measurement ID：與專案關聯的 Google Analytics measurement ID
- Google Sheet Link：與專案關聯的 Google Sheet 連結

## 驗證

當系統在執行測試前需要先登入時，可以在這裡設定 HTTP authentication 所需的帳號與密碼組合。

## Google Tag Manager

這個區塊包含多項 GTM 相關設定。

- Request Interception

  這項功能會攔截 GTM container 發出的 request，將其重組為類似 data layer 的資料結構，並在詳細頁中保留 raw request 供檢查。

- GTM Accompanied Mode

  這個模式會在稽核過程中同步開啟 GTM Preview，讓你確認標記是否有如預期觸發，也方便檢查已發佈版本的標記。

- GTM URL and Shareable Link

  GTM URL 指向要檢查的 workspace；shareable link 則是可分享給他人、用來預覽相同 GTM container 設定的連結。

## Browser arguments

此區塊包含兩部分：

- Browser arguments

  可傳給 Puppeteer 的進階瀏覽器參數，用來控制瀏覽器行為。

- Hide Browser

  可在背景執行測試時隱藏瀏覽器視窗。不過若啟用 GTM Accompanied Mode，瀏覽器仍會保持可見。

## 預載資料

預載資料會在測試開始前先載入到應用程式中，特別是 local storage 與 cookies。常見用途是預先載入 consent cookie，讓 analytics 收集在自動化開始前就處於允許狀態。

## Project IO

這項功能可讓你匯入與匯出專案。專案資料會以 zip 檔格式傳輸。
