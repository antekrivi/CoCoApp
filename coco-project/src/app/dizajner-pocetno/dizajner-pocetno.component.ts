import { Component, ViewChild } from '@angular/core';
import { OkvirComponent } from '../okvir/okvir.component';

@Component({
  selector: 'app-dizajner-pocetno',
  templateUrl: './dizajner-pocetno.component.html',
  styleUrls: ['./dizajner-pocetno.component.css']
})
export class DizajnerPocetnoComponent {
  @ViewChild('okvir') okvir: OkvirComponent;

  changeContent(content: string) {
    this.okvir.showContent(content);
  }
}
