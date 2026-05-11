# 設定

## プロジェクト情報

プロジェクト情報セクションでは、プロジェクト名、説明、measurement ID、関連する Google Sheet などの詳細を確認および編集できます。

- Project Name: プロジェクト名
- Description: プロジェクトの簡単な説明
- Measurement ID: プロジェクトに関連付けられた Google Analytics measurement ID
- Google Sheet Link: プロジェクトに関連付けられた Google Sheet へのリンク

## 認証

テスト実行前にログインが必要な場合は、ここで HTTP authentication に使うユーザー名とパスワードの組み合わせを設定します。

## Google Tag Manager

このセクションには GTM 関連の設定が含まれます。

- Request Interception

  この機能は GTM container から送信される request を傍受し、data layer に近い構造へ再整形します。raw request も詳細画面で確認できます。

- GTM Accompanied Mode

  このモードでは監査と同時に GTM Preview を実行し、タグが期待どおり発火しているかを確認できます。公開済みタグの監査にも便利です。

- GTM URL and Shareable Link

  GTM URL は確認対象の workspace を指し、shareable link は同じ GTM container 設定を他の人と共有するためのプレビューリンクです。

## Browser arguments

このセクションは 2 つの要素で構成されます。

- Browser arguments

  Puppeteer に渡す高度なブラウザ引数で、アプリケーションの動作を制御できます。

- Hide Browser

  テストをバックグラウンドで実行する際にブラウザウィンドウを非表示にできます。ただし GTM Accompanied Mode を有効にすると、ブラウザは表示されたままになります。

## プリロードデータ

プリロードデータは、テスト開始前にアプリケーションへ読み込まれるデータです。特に local storage や cookies が対象になります。よくある用途は、同意 cookie を事前に読み込み、自動化開始前に analytics の収集を許可状態にしておくことです。

## Project IO

この機能では、プロジェクトのインポートとエクスポートを行えます。プロジェクトデータは zip 形式でやり取りされます。
