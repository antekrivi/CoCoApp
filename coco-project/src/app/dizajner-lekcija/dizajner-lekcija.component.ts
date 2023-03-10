import { Component } from '@angular/core';
import { getDocs, query, collection, where, doc, deleteDoc } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';
import { MatDialog } from '@angular/material/dialog';
import { ZadatakComponent } from '../zadatak/zadatak.component';

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
  constructor(private firebaseSevice: FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService, private dialog: MatDialog) { }
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

  async obrisiPodtemuIZadatke(podtemaRef: any) {
    const zadaciRef = collection(podtemaRef, "Zadatak");
    const snapshot = await getDocs(zadaciRef);

    snapshot.forEach(async (doc) => {
      const odgovorRef = collection(doc.ref, "Odgovor");
      const odgovorSnapshot = await getDocs(odgovorRef);
      
      odgovorSnapshot.forEach((odgovorDoc) => {
        deleteDoc(odgovorDoc.ref);
      });
      
      deleteDoc(doc.ref);
    });

    deleteDoc(podtemaRef);
  }

  async reset(tema: boolean) {
    this.zadatci = null;
    this.selectedPodtema = "0";
    this.showZadatci = false;

    if (tema){
      this.teme$ = queryForDocuments(collection(this.db, '/lekcija')).then(res => res);
      this.selectedTema = "0";
      this.podteme = null;
    }
    else {
      this.getPodtemaByTema();
    }
  }
  
  obrisiPodtemu() {
    const optionPodtema = document.querySelector(`option[value="${this.selectedPodtema}"]`);
    const potvrda = window.confirm('Jeste li sigurni da želite obrisati podtemu "' + optionPodtema.textContent + '"?');
    if (potvrda) {
      const temaRef = doc(this.db, "lekcija", this.selectedTema);
      const podtemaRef = doc(temaRef, "Podtema", this.selectedPodtema);
      this.obrisiPodtemuIZadatke(podtemaRef); 
      this.reset(false);     
    } 
  }

  async obrisiTemu() {
    const optionTema = document.querySelector(`option[value="${this.selectedTema}"]`);
    const potvrda = window.confirm('Jeste li sigurni da želite obrisati temu "' + optionTema.textContent + '" i sve njezine podteme?');
    if (potvrda) {
      const temaRef = doc(this.db, "lekcija", this.selectedTema);
      
      const podtemeRef = collection(temaRef, "Podtema");
      const snapshot = await getDocs(podtemeRef);

      snapshot.forEach(async (doc) => {
        this.obrisiPodtemuIZadatke(doc);   
      });
      
      deleteDoc(temaRef);

      this.reset(true);
    } 
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

  //pop up prozor za zadatke
  openDialog(zadatak): void {
    const dialogRef = this.dialog.open(ZadatakComponent, {
      width: '600px',
      data: {
        zadatak: zadatak,
        podtema: this.selectedPodtema,
        tema: this.selectedTema
      }
    });
  }
}