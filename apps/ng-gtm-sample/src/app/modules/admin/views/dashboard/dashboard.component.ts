import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map.component';
import { CardComponent } from '../../components/card/card.component';

@Component({
    selector: 'app-dashboard',
    imports: [MapComponent, CardComponent],
    templateUrl: './dashboard.component.html',
    styles: [``]
})
export class DashboardComponent {
  sales = [
    {
      title: 'Daily Sales',
      icon: 'icon-arrow-up text-c-green',
      amount: '$249.95',
      percentage: '67%',
      progress: 50,
      design: 'col-md-6',
    },
    {
      title: 'Monthly Sales',
      icon: 'icon-arrow-down text-c-red',
      amount: '$2.942.32',
      percentage: '36%',
      progress: 35,
      design: 'col-md-6',
    },
    {
      title: 'Yearly Sales',
      icon: 'icon-arrow-up text-c-green',
      amount: '$8.638.32',
      percentage: '80%',
      progress: 70,
      design: 'col-md-12',
    },
  ];

  card = [
    {
      design: 'border-bottom',
      number: '235',
      text: 'TOTAL IDEAS',
      icon: 'icon-zap text-c-green',
    },
    {
      number: '26',
      text: 'TOTAL LOCATIONS',
      icon: 'icon-map-pin text-c-blue',
    },
  ];
}
