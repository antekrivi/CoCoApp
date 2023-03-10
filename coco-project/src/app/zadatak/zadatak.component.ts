import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from '../services/firebase-service.service';
import { getDocs, query, collection, where, doc, deleteDoc } from "firebase/firestore";

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
  selector: 'app-zadatak',
  templateUrl: './zadatak.component.html',
  styleUrls: ['./zadatak.component.css']
})
export class ZadatakComponent {
  constructor(private firebaseSevice: FirebaseService, @Inject(MAT_DIALOG_DATA) public data: any) { 
    this.getOdgovori();
  }


  db = this.firebaseSevice.getDb();

  putanja;
  zadatci;
  tocniOdgovori = [];
  sviOdgovori = [];
  rezultat: string;

  async getOdgovori() {
    //prvo dolazimo do svih zadataka iz podteme
    this.putanja = `/lekcija/${this.data.tema}/Podtema/${this.data.podtema}/Zadatak`;
    const zadatci = await queryForDocuments(collection(this.db, this.putanja));
    this.zadatci = zadatci;

    await this.waitUntilDataLoaded();

    this.sviOdgovori.sort(() => Math.random() - 0.5);
  }

  //dodatna funkcija kako bi se prvo pričekali svi odgovori i tek bi se onda prikazali 
  async waitUntilDataLoaded() {
    await Promise.all(this.zadatci.map(async zadatak => {
      let odgovori = await queryForDocuments(collection(this.db, this.putanja + `/${zadatak.unique_id}/Odgovor`));
      odgovori.forEach(odgovor => {
        this.sviOdgovori.push({ime: odgovor.tekst_odgovora, oznacen: false});
        if (zadatak.unique_id === this.data.zadatak.unique_id){
          this.tocniOdgovori.push(odgovor.tekst_odgovora);
        }
      });
    }));
  }

  provjeriOdgovore() {
    const oznaceniOdgovori = this.sviOdgovori.filter(odgovor => odgovor.oznacen).map(odgovor => odgovor.ime);
    const ispravniOdgovori = oznaceniOdgovori.every(odgovor => this.tocniOdgovori.includes(odgovor)) && (oznaceniOdgovori.length == this.tocniOdgovori.length);
    this.rezultat = ispravniOdgovori ? "Točno!" : "Netočno!";
  }
}
