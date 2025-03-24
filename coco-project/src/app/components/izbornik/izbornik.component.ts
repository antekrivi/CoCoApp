import { Component, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { RadnjaService } from '../../services/radnja.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-izbornik',
  templateUrl: './izbornik.component.html',
  styleUrls: ['./izbornik.component.css']
})
export class IzbornikComponent {
  @Output() contentChanged = new EventEmitter<string>();

  constructor(public actionService: RadnjaService,
    private router: Router) { }

  showContent(content: string){
    if (this.actionService.action === "edit") {
      //placeholder za buduci edit tab?
    }
    else {
      this.contentChanged.emit(content);
    }
  }

  logout(){
    // Clear user session data
  //this.actionService.clearSession();

  // Redirect to login page
    this.contentChanged.emit("login");
    this.router.navigate(['/login']);
  }
}
