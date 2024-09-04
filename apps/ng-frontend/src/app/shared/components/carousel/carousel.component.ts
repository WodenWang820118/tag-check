import { Observable } from 'rxjs';
import { AfterViewInit, Component, Input } from '@angular/core';
import { CarouselItem } from '@utils';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: `./carousel.component.html`,
  styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements AfterViewInit {
  @Input() items$!: Observable<CarouselItem[]>;
  currentIndex = 0;

  ngAfterViewInit(): void {
    console.log('CarouselComponent initialized');
    console.log('Items:', this.items$);
  }

  next(): void {
    this.items$.subscribe((items) => {
      this.currentIndex = (this.currentIndex + 1) % items.length;
    });
  }

  previous(): void {
    this.items$.subscribe((items) => {
      this.currentIndex = (this.currentIndex - 1 + items.length) % items.length;
    });
  }

  isActive(index: number): boolean {
    return this.currentIndex === index;
  }
}
