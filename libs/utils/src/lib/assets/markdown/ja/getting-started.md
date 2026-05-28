# はじめに

TagCheck は、計測仕様を統一し、その仕様を GTM 関連サイトや本番サイトのタグ検証に再利用できるようにします。

## Google Tag Manager とは

Google Tag Manager は、Web サイトやモバイルアプリのソースコードを直接変更せずに、マーケティングタグやトラッキングピクセルを管理・配信するためのツールです。Google Analytics や Facebook Pixel などの外部サービスに送るデータ収集タグを、開発者の作業なしで追加・更新できます。

## TagCheck とは

TagCheck は、Google Tag Manager（GTM）のタグ監査プロジェクトを管理するためのツールです。プロジェクトを作成し、タグを追加し、タグが正しい文脈で使われているか、あるいはそもそも発火しているかを監査できます。結果を確認したうえで、必要に応じてタグ設定を見直せます。

## プロジェクトと最初のテストケースを作成する

各プロジェクトには一意の project slug があり、Google Tag Manager と連携するための情報もあわせて入力できます。自動化を実行する前に必要なのは、仕様と録画データの 2 つです。

## 仕様

仕様は JSON 形式で定義します。例:

```json
{
  "event": "page_view",
  "page_location": "$page_location",
  "page_referrer": "$page_referrer"
}
```

TagCheck は主に次のパターンで値を検証します。

- `$` で始まる文字列: キーが存在するかだけを確認
- 固定値: 文字列または数値。`items` のような推奨イベントを除き、GA4 は配列オブジェクトを受け取りません
- 正規表現: 例 `^(?:switzerland|california)$`

## GTM タグ設定

作成したタグは `TagBuild` を使って GTM 互換の JSON に変換できます。変換後は、そのまま GTM に貼り付けるか、JSON ファイルとしてダウンロードできます。

## 録画データ

録画データは Chrome Recorder から出力される JSON ファイルです。現時点で TagCheck は CSS セレクターと ID セレクターをサポートしています。例:

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
      "url": "https://ng-gtm-sample.vercel.app/home"
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

この JSON ファイルをダウンロードして TagCheck にアップロードするか、内容をそのままエディターに貼り付けてください。

## テストを実行する

テーブル右上の再生ボタンをクリックすると、録画データとタグ設定に基づいてテストが実行されます。進行状況はリアルタイムに表示され、ステップ数は録画内の操作数に応じて決まります。例:

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
      "url": "https://ng-gtm-sample.vercel.app/home"
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

## テスト結果

テスト完了後、結果はすぐに更新され、主に data layer と request の 2 つに分かれます。

## Data layer

Data layer はブラウザの `window` オブジェクト配下にあるデータ構造です。Google Tag Manager はこれを監視して Google Analytics 4 へデータを送信します。`window.dataLayer` を確認することで、対象サイトが想定どおりのデータを所定のステップで push しているかを検証できます。

## Request

`Check Request` を有効にし、measurement ID を設定すると、TagCheck は measurement ID と event name に基づいて request を傍受します。その後、URL パラメータを分解し、data layer に近い形式へ再構成します。例:

'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK<br />&gtm=45je4410v9171567282z89168785492za200&\_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634<br />&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=<br />&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&\_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App<br />&en=add_to_cart&pr1=idcity001~ nmSwitzerland ~ lndestinations ~ caSwitzerland ~ qt1 ~ pr799&epn.value=799<br />&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&\_et=8682&tfd=30981'

これは次のように変換されます。

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

代表的な例は `add_to_wishlist` です。これは GA4 の推奨イベントなので `items` が正しく収集されます。一方、`remove_from_wishlist` のような非推奨イベントでは、GTM Preview には `items` が表示されても、Google Analytics 4 にはそのまま送られないことがあります。request の検査により、実際に送信されたデータをさらに確認できます。

## レポート

各テスト実行後、システムは自動的にレポートを生成します。内容には次が含まれます。

- Data layer specification: テストケース作成時に定義した仕様
- Actual data layer: ブラウザ `window` 配下の実際の data layer
- Request data layer: ネットワークリクエストから再構成した data layer
- Raw request: 取得できた場合、GA4 へ本当に送信されたかを検証するために利用可能
- Destination URL: イベントが発火したページ URL
- Screenshot: イベント発火時の画面キャプチャ

すべてのレポートはサイドバーの Reports メニューからダウンロードできます。
