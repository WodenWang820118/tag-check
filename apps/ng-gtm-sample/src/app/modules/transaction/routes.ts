export const TRANSACTION_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'basket',
        loadComponent: () =>
          import('./views/basket/basket.component').then(
            (m) => m.BasketComponent
          ),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./views/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          ),
      },
      {
        path: 'thankyou',
        loadComponent: () =>
          import('./views/thankyou/thankyou.component').then(
            (m) => m.ThankyouComponent
          ),
      },
    ],
  },
];
