import { Component } from '@angular/core';
import { getDocs, getDoc, collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AktivnostiDTO } from '../aktivnosti-dto';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';

async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  querySnapshot.forEach(async (snap) => {


    let noviObjekt = Object.assign({}, snap.data(), { ID: snap.id});
    rezultat.push(noviObjekt); 

  });
  return rezultat;
}

@Component({
  selector: 'app-aktivnost-edit',
  templateUrl: './aktivnost-edit.component.html',
  styleUrls: ['./aktivnost-edit.component.css']
})

export class AktivnostEditComponent {


db = this.firebaseService.getDb();

Razredi$ : any;
Lekcije$ : any
brojTableta: number;
brojUcenika: number;
VrijemeRjesavanja: number;
VrijemeDiskusije: number;
VrijemeIspravljanja: number;
selectedLekcija: string = "0";
selectedRazred: string = "0";
  constructor(private firebaseService :FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) {
    this.load();
  }
  async load() {

    this.Lekcije$ = queryForDocuments(collection(this.db, "lekcija")).then(res => res);
    this.Razredi$ = queryForDocuments(collection(this.db, "Razred")).then(res => res);
    console.log(this.radnjaService.radnja)


    if(this.radnjaService.radnja === "uredi"){
      const akt = await getDoc(doc(this.db, "Aktivnosti", this.radnjaService.odabranaAktivnost['id']));

      this.selectedLekcija = akt.get('Lekcija').id;
      this.selectedRazred = akt.get('Razred').id;
      this.Vrijeme = akt.get('Vrijeme');
      this.brojTableta = akt.get('BrojTableta');
      this.brojUcenika = akt.get('BrojUcenika');
    }
  }

  Vrijeme = {
    D: null,
    I: null,
    R: null
  };

  async onSubmit() {

    if(this.radnjaService.radnja == "uredi"){

      const AktivnostRef = await updateDoc(doc(this.db, "Aktivnosti", this.radnjaService.odabranaAktivnost['id']), {
        BrojTableta: this.brojTableta,
        BrojUcenika: this.brojUcenika,
        Vrijeme: this.Vrijeme,
        Lekcija: doc(this.db, "lekcija", this.selectedLekcija),
        Razred: doc(this.db, "Razred", this.selectedRazred)
  
      });
    }else{

    const AktivnostRef = await addDoc(collection(this.db, "Aktivnosti"), {
      BrojTableta: this.brojTableta,
      BrojUcenika: this.brojUcenika,
      Vrijeme: this.Vrijeme,
      Lekcija: doc(this.db, "lekcija", this.selectedLekcija),
      Razred: doc(this.db, "Razred", this.selectedRazred)

    });
    }
    this.dizajner.changeContent("da")
  }

  deleteAktivnost(){
    deleteDoc(doc(this.db, "Aktivnosti", this.radnjaService.odabranaAktivnost['id']));
    this.dizajner.changeContent("da");
  }

  public async insert(DTO : AktivnostiDTO){
    await addDoc(collection(this.db, "Aktivnosti"), DTO);
}

}
