import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DizajnerPocetnoComponent } from './dizajner-pocetno/dizajner-pocetno.component';
import { IzbornikComponent } from './izbornik/izbornik.component';
import { OkvirComponent } from './okvir/okvir.component';
import { DizajnerLekcijaComponent } from './dizajner-lekcija/dizajner-lekcija.component';
import { FormsModule } from '@angular/forms';
import { NovaLekcijaComponent } from './nova-lekcija/nova-lekcija.component';

@NgModule({
  declarations: [
    AppComponent,
    DizajnerPocetnoComponent,
    IzbornikComponent,
    OkvirComponent,
    DizajnerLekcijaComponent,
    NovaLekcijaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }