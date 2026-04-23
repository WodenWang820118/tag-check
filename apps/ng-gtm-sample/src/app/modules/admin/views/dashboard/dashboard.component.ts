import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map.component';
import { CardComponent } from '../../components/card/card.component';
import { ButtonModule } from 'primeng/button';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-dashboard',
  imports: [MapComponent, CardComponent, ButtonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  sales = [
    {
      title: 'Daily Sales',
      eyebrow: 'Today',
      amount: '$249.95',
      percentage: '+67%',
      progress: 50,
      accent: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Monthly Sales',
      eyebrow: 'Month to date',
      amount: '$2,942.32',
      percentage: '-36%',
      progress: 35,
      accent: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Yearly Sales',
      eyebrow: 'Annual run rate',
      amount: '$8,638.32',
      percentage: '+80%',
      progress: 70,
      accent: 'bg-blue-100 text-blue-700'
    }
  ];

  card = [
    {
      number: '235',
      text: 'TOTAL IDEAS',
      icon: 'pi pi-bolt',
      accent: 'bg-emerald-100 text-emerald-700'
    },
    {
      number: '26',
      text: 'TOTAL LOCATIONS',
      icon: 'pi pi-map-marker',
      accent: 'bg-blue-100 text-blue-700'
    }
  ];

  constructor(private readonly navigationService: NavigationService) {}

  navigateToAddData() {
    this.navigationService.navigateToAddData();
  }
}
