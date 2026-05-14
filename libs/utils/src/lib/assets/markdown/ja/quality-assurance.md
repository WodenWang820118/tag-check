# 品質保証

品質保証の中心は、システムが受け入れ条件を満たしているかを確認することです。この文書では、プラットフォーム上で QA フローを進める手順を順を追って説明します。

## レポート作成

テストケースを監査する前に、参照用の report を作成します。同じイベントが複数箇所で発火することがあるため、システムは各 report に event ID を割り当てます。たとえば `add_to_cart` が 2 件ある場合、最初のテストケースには JSON 仕様が必要です。例:

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

仕様は後から必要に応じて編集できます。イベント名は一意であるため、別の `add_to_cart` 仕様は追加できません。代わりに、他のテストケースはイベント名で共有仕様を参照します。例:

```json
{
  "event": "add_to_cart"
}
```

## 仕様レビュー

同じイベントの計測仕様は一貫しているべきです。仕様が統一されていれば、Google Analytics のレポートは理解しやすくなり、`(not set)` のような分かりにくい値も減らせます。仕様はグローバルに共有されるため、変更すると他のテストケースに影響する可能性があります。

## Chrome 録画

Chrome Recorder は、CSS/ID セレクター、XPath、そのほかの位置情報を記録し、各操作を表現します。一般的な操作はクリック、ホバー、入力、選択です。Recorder が生成した JSON をダウンロードしてシステムへアップロードすると、監査で利用できます。現時点で TagCheck は主に CSS/ID セレクターで自動化を実行します。

## Google Tag Manager

Google Tag Manager は、Web サイトのコードを直接変更せずにデータ計測へ集中できる収集ツールです。TagCheck は、繰り返しの手動テストを減らし、ビジネス要件に対してより高品質な QA を行えるよう支援することを目的としています。

## Data layer

Data layer は、ユーザー操作とデータ収集パイプラインをつなぐ JavaScript オブジェクトです。たとえば、ユーザーがボタンをクリックすると、定義されたデータが data layer に送られ、それに応じて GTM のタグが発火します。そのため、data layer の検査は実装品質を確認するための中核機能のひとつです。

## Request 傍受

多くの場合、data layer の確認だけで十分です。ただし、GTM Preview では正しく見えても、Google Analytics に届く値は変換されていることがあります。たとえば配列が文字列に変換されるケースです。こうした誤判定を減らすために、TagCheck は送信 request も監査できます。プロジェクトに設定された measurement ID を使って request を傍受し、data layer に近いオブジェクトへ再構成したうえで、同じ検証ロジックを適用します。

## GTM accompanied mode

GTM accompanied mode を使うと、自動化の実行中に GTM Preview でタグの発火状況を同時に確認できます。未公開の workspace を確認したい場合にも有効です。利用するには、GTM container の shareable link とランディングページ URL をシステムに渡してください。
