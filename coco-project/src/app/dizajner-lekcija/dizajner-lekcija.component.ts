import { Component } from '@angular/core';
import { getDocs, query, collection, where } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';

//funkcija za čitanje više dokumenata
async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  const allDocs = querySnapshot.forEach((snap) => {
    let noviObjekt = Object.assign({}, snap.data(), { unique_id: snap.id });
    rezultat.push(noviObjekt); 
  });
  return rezultat;
}

@Component({
  selector: 'app-dizajner-lekcija',
  templateUrl: './dizajner-lekcija.component.html',
  styleUrls: ['./dizajner-lekcija.component.css'],
})

export class DizajnerLekcijaComponent {
  constructor(private firebaseSevice: FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) { }
  db = this.firebaseSevice.getDb();
  showZadatci = false;


  teme$ = queryForDocuments(collection(this.db, '/lekcija')).then(res => res);
  selectedTema: string = "0";
  selectedPodtema: string = "0";
  podteme;
  putanja: string;
  zadatci;

  //nova lekcija
  dodajLekciju(content: string) {
    this.dizajner.changeContent(content);
    this.radnjaService.radnja = 'lekcija';
  }

  //odabir teme
  onTemaSelected() {
    this.zadatci = null;
    this.selectedPodtema = "0";
    this.showZadatci = false;
    this.getPodtemaByTema();
  }

  //dohvaćanje podtema za odabranu temu
  async getPodtemaByTema() {
    this.putanja = `/lekcija/${this.selectedTema}/Podtema`;
    const podteme = await queryForDocuments(collection(this.db, this.putanja));
    this.podteme = podteme;
  }

  //odabir podteme
  onPodtemaSelected() {
    this.getZadataciByPodtema();
  }

  //dohvaćanje zadataka za odabranu temu i podtemu
  async getZadataciByPodtema() {
    const zadatci = await queryForDocuments(collection(this.db, `/lekcija/${this.selectedTema}/Podtema/${this.selectedPodtema}/Zadatak`));
    this.zadatci = zadatci;
    this.showZadatci = true;
  }

  dodajPodtemu(content: string) {
    this.dizajner.changeContent(content);
    this.radnjaService.radnja = 'podtema';
    this.radnjaService.odabranaTema['id'] = this.selectedTema;
    const option = document.querySelector(`option[value="${this.selectedTema}"]`);
    this.radnjaService.odabranaTema['tema'] = option.textContent;
  }

  urediLekciju(content: string) {
    this.dizajner.changeContent(content);
    this.radnjaService.radnja = 'uredi';
    this.radnjaService.odabranaTema['id'] = this.selectedTema;
    const optionTema = document.querySelector(`option[value="${this.selectedTema}"]`);
    this.radnjaService.odabranaTema['tema'] = optionTema.textContent;
    this.radnjaService.odabranaPodtema['id'] = this.selectedPodtema;
    const optionPodtema = document.querySelector(`option[value="${this.selectedPodtema}"]`);
    this.radnjaService.odabranaPodtema['naziv'] = optionPodtema.textContent;
  }

  //pop up prozor za zadatke - trebala bi implementirati i komponentu TaskDialogComponent i na liknove dodati (click)="openTask(task)"
  /*tasks: any[];

  constructor(public dialog: MatDialog) {
    this.tasks = [
      { title: 'Zadatak 1', description: 'Opis zadatka 1' },
      { title: 'Zadatak 2', description: 'Opis zadatka 2' },
      { title: 'Zadatak 3', description: 'Opis zadatka 3' },
    ];
  }

  openTask(task: any) {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '500px',
      data: task
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`The dialog was closed. Result: ${result}`);
    });
  }*/
}