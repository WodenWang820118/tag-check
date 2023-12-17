export const specs = [
  {
    event: 'select_item',
    ecommerce: {
      value: '$value',
      currency: '$currency',
      items: [
        {
          item_id: '$item_id',
          item_name: '$item_name',
          item_category: '$item_category',
          price: '$price',
          quantity: '$quantity',
        },
      ],
    },
  },
  {
    event: 'view_promotion',
    ecommerce: {
      creative_name: '$creative_name',
      creative_slot: '$creative_slot',
      promotion_id: '$promotion_id',
      promotion_name: '$promotion_name',
      items: [
        {
          item_id: '$item_id',
          item_name: '$item_name',
        },
      ],
    },
  },
];
