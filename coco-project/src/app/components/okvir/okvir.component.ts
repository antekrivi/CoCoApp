import { Component } from '@angular/core';

@Component({
  selector: 'app-okvir',
  template: `
    <ng-container [ngSwitch]="contentToShow">
      <app-activity-designer *ngSwitchCase="'da'"></app-activity-designer>
      <app-dizajner-lekcija *ngSwitchCase="'dl'"></app-dizajner-lekcija>
      <app-nova-lekcija *ngSwitchCase="'nl'"></app-nova-lekcija>
      <app-statistics *ngSwitchCase="'s'"></app-statistics>
      <app-results *ngSwitchCase="'r'"></app-results>
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
