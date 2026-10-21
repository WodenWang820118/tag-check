# 設定の詳細

各プロジェクトには独自の設定があり、プロジェクトのメニューの **Settings** から開けます。変更を保持するには、各ページで **Save** を選択します。

## Project Information

- **Project Name**: Projects ページに表示される名前です。
- **Measurement ID**: サイトの送信先となる GA4 の測定 ID です。リクエストチェックは、この ID に送信された GA4 リクエストを探します。
- **Project Description**: 任意のメモです。

## Pre-loading Values

各実行の前に TagCheck が設定する値です。これにより、サイトはテストに必要な状態で開始されます。

- **Website URL**: テスト対象のサイトです。TagCheck は、下記の Cookie をこのサイトのドメインに設定します。
- **Local Storage**: キーと値のペアです（サイトがローカルストレージに保持する同意状態など）。TagCheck は、実行で開く各ページのスクリプトより前にこれらを書き込みます。
- **Cookie**: 名前と値のペアです（同意 Cookie など）。

同意がないと、多くのサイトはアナリティクスタグをブロックし、両方のチェックが失敗します。

## Authentication

HTTP 認証で保護されたサイト用の **Username** と **Password** です。サイトから要求されたときに TagCheck が送信します。

## Google Tag Manager

- **Activate Accompanied Mode**: 各テストを GTM Preview 経由で実行し、プレビュー中のワークスペースのタグをテスト対象にします。Preview Mode URL が必要です。
- **Activate Request Check**: データレイヤーに加えて GA4 リクエストもチェックします。測定 ID が必要です。
- **GTM URL**: Tag Manager 上のコンテナのワークスペースのアドレスです。参照用に保存されます。
- **Preview Mode URL**: プレビューセッションの Tag Assistant のアドレスです。Tag Manager で **Preview** を開始し、Tag Assistant に表示されるアドレスをコピーします。このアドレスには、コンテナ ID とサイトが含まれます（例: `https://tagassistant.google.com/#/?id=GTM-XXXXXXX&url=https%3A%2F%2Fexample.com`）。

## Browser Settings

- **Hide the browser?**: ウィンドウを表示せずに Chrome を実行します。Accompanied Mode では常にウィンドウが表示されます。
- **Add browser setting**: 実行時に使う Chrome のコマンドライン引数を追加します（例: `--window-size=1280,800`）。

## Export or Delete

- **Export**: プロジェクトを、テスト、スペック、記録、結果とともに ZIP ファイルとしてダウンロードします。別のコンピューターでは、New Project ページの **Already got the project?** からインポートします。
- **Delete**: プロジェクトとその中のすべてを削除します。この操作は元に戻せません。
