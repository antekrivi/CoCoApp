import { Component } from '@angular/core';

@Component({
  selector: 'app-okvir',
  template: `
    <ng-container [ngSwitch]="contentToShow">
      <app-dizajner-lekcija *ngSwitchCase="'dl'"></app-dizajner-lekcija>
      <app-nova-lekcija *ngSwitchCase="'nl'"></app-nova-lekcija>
    </ng-container>
  `,
  styleUrls: ['./okvir.component.css']
})

export class OkvirComponent {
  contentToShow = 'dl';
  
  showContent(content: string) {
    this.contentToShow = content;
  }
}