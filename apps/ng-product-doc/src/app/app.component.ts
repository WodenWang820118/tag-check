import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `<router-outlet />`,
  styles: [``]
})
export class AppComponent implements OnInit {
  title = 'TagCheck';
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/documentation']);
  }
}
