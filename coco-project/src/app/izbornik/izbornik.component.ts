import { Component, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-izbornik',
  templateUrl: './izbornik.component.html',
  styleUrls: ['./izbornik.component.css']
})
export class IzbornikComponent {
  @Output() contentChanged = new EventEmitter<string>();

  showContent(content: string){
    this.contentChanged.emit(content);
  }
}
