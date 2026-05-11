# ユースケース

Google Analytics のレポートに現れる異常は、タグの問題を示す手がかりになることがあります。たとえば page view が急に大きく減少したり、特定イベントに `(not set)` パラメータが現れたりする場合、Google Tag Manager 内のタグ実装が正しくない可能性があります。監査を実行することで、誤って発火しているタグを特定し、修正できます。

TagCheck が特に適しているのは次のようなケースです。

- 多数のタグを運用する大規模サイト
- GTM 内に複雑なカスタムタグ設定があるサイト
- Web サイトや GTM タグの変更が頻繁なチーム

## GTM と連動した自動化

GTM の shareable link を設定すると、監査を accompanied mode で実行できます。監査中は別のブラウザインスタンスで GTM Preview が開き、自動化の実行と同時にタグの発火をリアルタイムで確認できます。

## タグ発火の検証

このケースでは、ユーザーはまったく発火していないタグを見つけたいと考えています。タグは data layer の内容に依存するため、失敗の原因は trigger 設定の不備や、タグ実装の誤りである可能性があります。

## パラメータの検証

計測仕様に基づき、監査ではタグが正しいパラメータで発火しているかも確認できます。例:

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

- `item_id` はキーが存在することだけを確認し、実際の値は比較しません。`$item_id` はプレースホルダーとして使え、計測設計時の参照に便利です
- `item_name` は `switzerland` または `california` に一致する正規表現である必要があります
- `item_category` は厳密に `Europe` である必要があります
- `quantity` は整数 `1` である必要があります

## 偽陽性 request の特定

GTM container では、タグが正しく実装されているように見えても、実際に Google Analytics に送信されるデータは期待どおりでないことがあります。たとえば、配列型パラメータを含むカスタムイベントは Google Analytics ではサポートされない場合があります。TagCheck は request を傍受し、情報を data layer に近い形式へ整形したうえで、仕様どおりかどうかを検証します。例:

```typescript
{
  event: 'remove_from_wishlist',
  ecommerce: {
    items: [
      {
        item_id: '$item_id',
        item_name: '^(?:switzerland|california)$',
        item_category: 'Europe',
        quantity: 1,
        price: 200
      }
    ],
    currency: 'USD',
    value: 200
  }
}
```

`remove_from_wishlist` の `items` 配列は GTM Preview では表示されても、GA4 の推奨イベントではないため Google Analytics に保存されません。この場合、監査はタグを失敗としてマークし、その理由を示します。
