import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { firebaseConfig } from "./firebase-config";
import { ActivityDesignerComponent } from './activity-designer/activity-designer.component';
import { PodtemaComponent } from './podtema/podtema.component';
import { PodtemaZadatakComponent } from './podtema-zadatak/podtema-zadatak.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { ResultsComponent } from './results/results.component';
import { ChartModule } from 'angular-highcharts';
import { TimeMaskDirective } from './activity-designer/TimeMaskDirective';
import { MatTableModule } from "@angular/material/table";

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
    PodtemaComponent,
    PodtemaZadatakComponent,
    StatisticsComponent,
    ResultsComponent,
    TimeMaskDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    AngularFireModule.initializeApp(firebaseConfig),
    MatIconModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    HighchartsChartModule,
    ChartModule,
    MatTableModule
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
