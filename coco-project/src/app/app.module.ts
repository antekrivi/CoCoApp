import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DizajnerPocetnoComponent } from './dizajner-pocetno/dizajner-pocetno.component';
import { IzbornikComponent } from './izbornik/izbornik.component';
import { OkvirComponent } from './okvir/okvir.component';
import { DizajnerLekcijaComponent } from './dizajner-lekcija/dizajner-lekcija.component';

@NgModule({
  declarations: [
    AppComponent,
    DizajnerPocetnoComponent,
    IzbornikComponent,
    OkvirComponent,
    DizajnerLekcijaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
