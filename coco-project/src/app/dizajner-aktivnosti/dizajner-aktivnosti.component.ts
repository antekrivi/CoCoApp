import { Component } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, DocumentReference, getDoc, getDocs } from 'firebase/firestore';
import { AktivnostiDTO } from '../aktivnosti-dto';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';


//funkcija za čitanje više dokumenata
async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  querySnapshot.forEach(async (snap) => {

    
    const Lekcija = await getDoc(snap.get("Lekcija"));
    const Razred = await getDoc(snap.get("Razred"));
    console.log(Lekcija.get("tema"));
    console.log(Razred.get("Oznaka"));

    let noviObjekt = Object.assign({}, snap.data(), { ID: snap.id, 
      NazivLekcije: Lekcija.get("tema"), 
      NazivRazred: Razred.get("Oznaka")});
    rezultat.push(noviObjekt); 

  });
  return rezultat;
}

@Component({
  selector: 'app-dizajner-aktivnosti',
  templateUrl: './dizajner-aktivnosti.component.html',
  styleUrls: ['./dizajner-aktivnosti.component.css']
})
export class DizajnerAktivnostiComponent {
onAktivnostSelected() {
this.radnjaService.odabranaAktivnost['id'] = this.selectedAktivnost;
this.radnjaService.radnja = "uredi";
this.dizajner.changeContent("ae");
}
  constructor(private firebaseService :FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) {
    this.load();
  }


  //nova Aktivnost
  dodajAktivnost(content: string) {
    this.dizajner.changeContent(content);
    this.radnjaService.radnja = 'novi';
  }


  db = this.firebaseService.getDb();
  selectedAktivnost: string = "0";
  aktivnosti$: any;

  async load(){  
  this.aktivnosti$ = queryForDocuments(collection(this.db, "Aktivnosti")).then(res => res);
  }

  public async insert(DTO : AktivnostiDTO){
      await addDoc(collection(this.db, "Aktivnosti"), DTO);
  }
  
  public async update(DTO : AktivnostiDTO){
      //await addDoc(collection(DTO.ID, "aktivnosti"), DTO);
  }
  
  public async delete(AktivRef :DocumentReference){
      await deleteDoc(AktivRef);
  }
}
