import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DizajnerPocetnoComponent } from './dizajner-pocetno/dizajner-pocetno.component';
import { IzbornikComponent } from './izbornik/izbornik.component';
import { OkvirComponent } from './okvir/okvir.component';
import { DizajnerLekcijaComponent } from './dizajner-lekcija/dizajner-lekcija.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NovaLekcijaComponent } from './nova-lekcija/nova-lekcija.component';
import { ZadatakComponent } from './zadatak/zadatak.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { firebaseConfig } from "./firebase-config";
import { ActivityDesignerComponent } from './activity-designer/activity-designer.component';


@NgModule({
  declarations: [
    AppComponent,
    DizajnerPocetnoComponent,
    IzbornikComponent,
    OkvirComponent,
    DizajnerLekcijaComponent,
    NovaLekcijaComponent,
    ZadatakComponent,
    ActivityDesignerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }