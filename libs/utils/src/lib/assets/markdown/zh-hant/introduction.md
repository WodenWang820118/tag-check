# 介紹

在這裡，你可以了解 TagCheck 的用途，以及如何使用這個應用程式。

## 快速開始

本節會帶你完成上手所需的基本步驟，並說明 TagCheck 如何協助你管理 Google Tag Manager（GTM）標記稽核專案。

## 專案

本節會介紹如何在系統中建立與管理專案，包括建立新專案、加入標記、執行稽核，以及編輯或刪除專案等管理功能。

## 設定

本節會說明如何依需求調整系統設定，內容包含：

- 專案資訊
- 驗證
- 預載資料
- Browser Arguments
- Google Tag Manager 與請求攔截設定
- 專案匯入與匯出

## TagCheck 的運作方式

以下簡要說明 TagCheck 的核心運作流程。

## Puppeteer

Puppeteer 是一個 Node.js 函式庫，提供高階 API 來透過 DevTools Protocol 控制無頭 Chrome 或 Chromium。TagCheck 會利用它執行瀏覽器自動化稽核，也能同時操作多個瀏覽器實例，以滿足品質保證流程的需求。

## Chrome Recorder

Chrome Recorder 是用來記錄使用者瀏覽器操作並產生 Puppeteer 腳本的工具。TagCheck 會使用 Recorder 輸出的 JSON 格式來重播操作流程，並由 Puppeteer 執行稽核。

## 稽核流程

當使用者執行稽核時，系統會建立新的瀏覽器實例並重播已錄製的操作流程，接著檢查標記是否正確觸發，最後產出稽核報告。報告會列出未正確觸發的標記，以及失敗原因。
