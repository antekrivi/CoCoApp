import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DizajnerPocetnoComponent } from './components/dizajner-pocetno/dizajner-pocetno.component';
import { IzbornikComponent } from './components/izbornik/izbornik.component';
import { OkvirComponent } from './components/okvir/okvir.component';
import { DizajnerLekcijaComponent } from './components/dizajner-lekcija/dizajner-lekcija.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NovaLekcijaComponent } from './components/nova-lekcija/nova-lekcija.component';
import { ZadatakComponent } from './components/zadatak/zadatak.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { AngularFireModule } from "@angular/fire/compat";
import { MatIconModule } from '@angular/material/icon';
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { firebaseConfig } from "./firebase-config";
import { ActivityDesignerComponent } from './components/activity-designer/activity-designer.component';
import { PodtemaComponent } from './components/podtema/podtema.component';
import { PodtemaZadatakComponent } from './components/podtema-zadatak/podtema-zadatak.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { ResultsComponent } from './components/results/results.component';
import { ChartModule } from 'angular-highcharts';
import { TimeMaskDirective } from './components/activity-designer/TimeMaskDirective';
import { MatTableModule } from "@angular/material/table";
import { UserRegisterComponent } from './components/user-register/user-register.component';
import { UserLoginComponent } from './components/user-login/user-login.component';

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
    UserRegisterComponent,
    UserLoginComponent,
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
