import { ProjectInfo, Setting } from '@utils';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatMenuModule,
    MatSelectModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  @Input() settings!: Setting | undefined;
  @Input() snav!: MatSidenav | undefined;
  @Input() projects!: ProjectInfo[] | null;
  @Output() changeProject = new EventEmitter<string>();

  onChangeProject(projectSlug: string) {
    this.changeProject.emit(projectSlug);
  }
}
