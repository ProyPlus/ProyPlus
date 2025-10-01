import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home-students',
  imports: [],
  templateUrl: './home-students.component.html',
  styleUrl: './home-students.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeStudentsComponent { }
