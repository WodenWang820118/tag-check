export const TRANSACTION_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'basket',
        data: { seoKey: 'transaction' },
        loadComponent: () =>
          import('./views/basket/basket.component').then(
            (m) => m.BasketComponent
          )
      },
      {
        path: 'checkout',
        data: { seoKey: 'transaction' },
        loadComponent: () =>
          import('./views/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          )
      },
      {
        path: 'thankyou',
        data: { seoKey: 'transaction' },
        loadComponent: () =>
          import('./views/thankyou/thankyou.component').then(
            (m) => m.ThankyouComponent
          )
      }
    ]
  }
];
