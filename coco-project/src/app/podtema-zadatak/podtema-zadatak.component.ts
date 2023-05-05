import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-podtema-zadatak',
  templateUrl: './podtema-zadatak.component.html',
  styleUrls: ['./podtema-zadatak.component.css']
})

export class PodtemaZadatakComponent {
  @Input() theme: string;
  @Input() subtheme: string;
  @Input() task: string;
  @Input() answers;
}
