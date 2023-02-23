import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, query, collection, where } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';

//konekcija s bazom
const firebaseConfig = {
  apiKey: "AIzaSyDcFmO6DWuv5I1JAG3Xbf5ShqOpeiIk9ZE",
  authDomain: "coco-29838.firebaseapp.com",
  databaseURL: "https://coco-29838-default-rtdb.firebaseio.com",
  projectId: "coco-29838",
  storageBucket: "coco-29838.appspot.com",
  messagingSenderId: "286635283337",
  appId: "1:286635283337:web:6fb0743d4779e4744f8758",
  measurementId: "G-F8BNDEKQZR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  const allDocs = querySnapshot.forEach((snap) => {
    rezultat.push(snap.data()); 
  })
  return (rezultat);
}

@Component({
  selector: 'app-dizajner-lekcija',
  templateUrl: './dizajner-lekcija.component.html',
  styleUrls: ['./dizajner-lekcija.component.css'],
})

export class DizajnerLekcijaComponent {
  teme$ = queryForDocuments(collection(db, '/lekcija')).then(res => res);
  selectedTema: string = "0";
  selectedPodtema: string = "0";
  podteme;
  putanja: string;
  zadatci;

  //nova lekcija
  constructor(private dizajner: DizajnerPocetnoComponent) { }

  dodajLekciju(content: string) {
    this.dizajner.changeContent(content);
  }

  //odabir teme
  onTemaSelected(selected: Event) {
    const selectElement = selected.target as HTMLSelectElement;
    this.selectedTema = selectElement.value;
    this.getPodtemaByTema(this.selectedTema);
  }

  //dohvaćanje podtema za odabranu temu
  async getPodtemaByTema(id_teme: string) {
    const q = query(collection(db, 'lekcija'), where('id', '==', Number(id_teme)));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      this.putanja = `/lekcija/${doc.id}/Podtema`;
      const podteme = await queryForDocuments(collection(db, this.putanja));
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
    const q = query(collection(db, `${this.putanja}`), where('id', '==', Number(id_podteme)));
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const zadatci = await queryForDocuments(collection(db, `${this.putanja}/${doc.id}/Zadatak`));
      this.zadatci = zadatci;
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