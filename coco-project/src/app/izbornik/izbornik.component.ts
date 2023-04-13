import { Component, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { RadnjaService } from '../services/radnja.service';

@Component({
  selector: 'app-izbornik',
  templateUrl: './izbornik.component.html',
  styleUrls: ['./izbornik.component.css']
})
export class IzbornikComponent {
  @Output() contentChanged = new EventEmitter<string>();

  constructor(public actionService: RadnjaService) { }

  showContent(content: string){
    if (this.actionService.action === "edit") {
     
    }
    else {
      this.contentChanged.emit(content);
    }
  }
}
