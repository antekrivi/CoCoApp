import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { getDocs, query, collection, where } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';

//funkcija za čitanje više dokumenata
async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  const allDocs = querySnapshot.forEach((snap) => {
    rezultat.push(snap.data()); 
  });
  return rezultat;
}

@Component({
  selector: 'app-dizajner-lekcija',
  templateUrl: './dizajner-lekcija.component.html',
  styleUrls: ['./dizajner-lekcija.component.css'],
})

export class DizajnerLekcijaComponent {
  constructor(private firebaseSevice: FirebaseService, private dizajner: DizajnerPocetnoComponent) { }
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
  }

  //odabir teme
  onTemaSelected(selected: Event) {
    const selectElement = selected.target as HTMLSelectElement;
    this.selectedTema = selectElement.value;
    this.zadatci = null;
    this.selectedPodtema = "0";
    this.showZadatci = false;
    this.getPodtemaByTema(this.selectedTema);
  }

  //dohvaćanje podtema za odabranu temu
  async getPodtemaByTema(id_teme: string) {
    const q = query(collection(this.db, 'lekcija'), where('id', '==', Number(id_teme)));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      this.putanja = `/lekcija/${doc.id}/Podtema`;
      const podteme = await queryForDocuments(collection(this.db, this.putanja));
      this.podteme = podteme;
    }
  }

  //odabir podteme
  onPodtemaSelected(selected: Event) {
    const selectElement = selected.target as HTMLSelectElement;
    this.selectedPodtema = selectElement.value;
    this.getZadataciByPodtema(this.selectedPodtema);
  }

  //dohvaćanje zadataka za odabranu temu i podtemu
  async getZadataciByPodtema(id_podteme: string) {
    const q = query(collection(this.db, `${this.putanja}`), where('id', '==', Number(id_podteme)));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const zadatci = await queryForDocuments(collection(this.db, `${this.putanja}/${doc.id}/Zadatak`));
      this.zadatci = zadatci;
      this.showZadatci = true;
    }
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