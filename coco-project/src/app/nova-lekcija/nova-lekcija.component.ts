import { Component, ElementRef, ViewChild } from '@angular/core';
import { FirebaseService } from '../services/firebase-service.service';
import { collection, addDoc, writeBatch, doc, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { RadnjaService } from '../services/radnja.service';

async function queryForDocuments(new_query){
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  const allDocs = querySnapshot.forEach((snap) => {
    let noviObjekt = Object.assign({}, snap.data(), { unique_id: snap.id });
    rezultat.push(noviObjekt); 
  });
  return rezultat;
}

function formirajFormArray(popisZadataka: string[]): FormArray {
  const formArray = new FormArray([]);
  for (const zadatak of popisZadataka) {
    formArray.push(new FormControl(zadatak, Validators.required));
  }
  console.log(formArray);
  return formArray;
}

@Component({
  selector: 'app-nova-lekcija',
  templateUrl: './nova-lekcija.component.html',
  styleUrls: ['./nova-lekcija.component.css']
})
export class NovaLekcijaComponent {
  constructor(private firebaseSevice: FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) { }
  db = this.firebaseSevice.getDb();
  @ViewChild('naslov', {static: true}) naslovElement: ElementRef;
  @ViewChild('gumb', {static: true}) gumbElement: ElementRef;

  ngOnInit(): void {
    //ako dodajemo podtemu unutar postojeće teme
    if(this.radnjaService.radnja === 'podtema') {
      this.lekcijaForma.get('tema').setValue(this.radnjaService.odabranaTema['tema']);
      this.lekcijaForma.get('tema').disable();
      this.naslovElement.nativeElement.innerText = 'Nova podtema';
      this.gumbElement.nativeElement.innerText = 'Dodaj podtemu';
    }
    
    //ako uređujemo postojuću lekciju
    else if (this.radnjaService.radnja === 'uredi'){
      this.naslovElement.nativeElement.innerText = 'Uredi lekciju';
      this.gumbElement.nativeElement.innerText = 'Spremi promjene';
      //dodavanje teme i podteme u FormGroup
      this.lekcijaForma.get('tema').setValue(this.radnjaService.odabranaTema['tema']);
      this.lekcijaForma.get('podtema').setValue(this.radnjaService.odabranaPodtema['naziv']);

      //dohavaćanje zadataka i odgovora
      this.getPopisZadatakaOdgovora();
    }
  }
  
  async getPopisZadatakaOdgovora() {
    let popisZadataka = [];
    let popisOdgovora = [];
    let zadatci = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak`));
    
    for (const zadatak of zadatci) {
      popisZadataka.push(zadatak.tekst_zadatka);
      let odgovori = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak/${zadatak.unique_id}/Odgovor`));
      
      let odgovori2 = [];
      odgovori.forEach(odgovor => {
        odgovori2.push(odgovor.tekst_odgovora);
      });
      popisOdgovora.push(odgovori2);
    }
 
    //dodavanje zadataka u FormGroup
    const formArray = this.lekcijaForma.get('zadatci') as FormArray;
    formArray.clear();
    popisZadataka.forEach(zadatak => formArray.push(new FormControl(zadatak, Validators.required)));

    //dodavanje odgovora u FormGroup
    const formArray2 = this.lekcijaForma.get('odgovori') as FormArray;
    formArray2.clear();     
    popisOdgovora.forEach(odgovori => {
      const odgovoriFormArray = new FormArray([]);
      odgovori.forEach(odgovor => odgovoriFormArray.push(new FormControl(odgovor, Validators.required)));
      formArray2.push(odgovoriFormArray);
    });
  }  

  //može biti najviše 4 vrste zadatka jer se tablet dijeli na max. 4 učenika
  maxZadataka = 4;

  lekcijaForma = new FormGroup({
    tema: new FormControl('', Validators.required),
    podtema: new FormControl('', Validators.required),
    zadatci: new FormArray([
      new FormControl('', Validators.required),
      new FormControl('', Validators.required)
    ]),
    //odgovorTip: new FormControl('tekst', Validators.required), --- OVO JE KAD ĆU IMPLEMENTIRATI I OPTION SELECT DA ODGOVOR MOŽE BITI SLIKA
    odgovori: new FormArray([
      new FormArray([
        new FormControl('', Validators.required)
      ]),
      new FormArray([
        new FormControl('', Validators.required)
      ])
    ])
  });  

  get zadatci(): FormArray {
    return this.lekcijaForma.get('zadatci') as FormArray;
  }

  get odgovori(): FormArray {
    return this.lekcijaForma.get('odgovori') as FormArray;
  }

  getOdgovori(index: number): FormArray {
    return (this.lekcijaForma.get('odgovori') as FormArray).at(index) as FormArray;
  }

  addZadatak() {
    this.zadatci.push(new FormControl('', Validators.required));
    const odgovoriZaNoviZadatak = new FormArray([
      new FormControl('', Validators.required)
    ]);
    this.odgovori.push(odgovoriZaNoviZadatak);
  }

  removeZadatak(i: number) {
    this.zadatci.removeAt(i);
    this.odgovori.removeAt(i);
  }
  
  addOdgovor(index: number) {
    this.getOdgovori(index).push(new FormControl('', Validators.required));
  }

  removeOdgovor(i: number, j: number) {
    this.getOdgovori(i).removeAt(j);
  }

  //funkcija za dodavanje u bazu
  async dodajLekciju(values: any) {
    //provjerava se prvo jel se dodaje lekcija ili podtema u postojeću lekciju
    let podtemaRef;
    if(this.radnjaService.radnja === 'lekcija'){
      const lekcijaRef = await addDoc(collection(this.db, "lekcija"), {
        tema: values.tema
      });
      
      podtemaRef = await addDoc(collection(lekcijaRef, "Podtema"), {
        naziv: values.podtema
      });
    }
    else if (this.radnjaService.radnja === 'podtema'){
      podtemaRef = await addDoc(collection(this.db, `lekcija/${this.radnjaService.odabranaTema['id']}/Podtema`), {
        naziv: values.podtema
      });
    }    
    this.dodajZadatkeOdgovore(values, podtemaRef);
  } 
  
  async dodajZadatkeOdgovore (values: any, podtemaRef: any){
    const zadatciObjekti = values.zadatci.map(zadatak => ({ tekst_zadatka: zadatak }));
    const odgovoriObjekti = values.odgovori.map(red => red.map(odgovor => ({ tekst_odgovora: odgovor })));
    console.log(zadatciObjekti);
    console.log(odgovoriObjekti);

    const batch = writeBatch(this.db);

    zadatciObjekti.forEach((zadatak, index) => {
      const noviZadatakRef = doc(collection(podtemaRef, "Zadatak"));
      batch.set(noviZadatakRef, zadatak);
    
      const odgovori = odgovoriObjekti[index];
      odgovori.forEach(odgovor => {
        const noviOdgovorRef = doc(collection(noviZadatakRef, "Odgovor"));
        batch.set(noviOdgovorRef, odgovor);
      });
    });
 
    await batch.commit();
  }
 
  async updateLekcija(values: any) {
    //update teme
    const temaRef = doc(this.db, "lekcija", this.radnjaService.odabranaTema['id']);
    const docSnap = await getDoc(temaRef);
    const temaData = docSnap.data();
    temaData['tema'] = values.tema;
    await updateDoc(temaRef, temaData);

    //update podteme
    const podtemaRef = doc(temaRef, "Podtema", this.radnjaService.odabranaPodtema['id']);
    const docSnap2 = await getDoc(podtemaRef);
    const podtemaData = docSnap2.data();
    podtemaData['naziv'] = values.podtema;
    await updateDoc(podtemaRef, podtemaData);

    //update zadataka i odgovora
    //prvo obriši trenutne
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

    //dodaj nove zadatke i odgovore
    this.dodajZadatkeOdgovore(values, podtemaRef);
 
    console.log("Dokument je uspješno ažuriran.");
  }


  save() {
    if (this.lekcijaForma.invalid) {
      this.lekcijaForma.markAllAsTouched();
      return;
    }
    else {
      const values = this.lekcijaForma.value;

      //dodavanje u bazu
      //dodavanje u bazu i povratak na moje lekcije
      //provjerava se uređuje li se postojeća lekcija
      if(this.radnjaService.radnja === 'uredi'){
        const updatedData = {
          tema: values.tema,
          podtema: values.podtema,
          zadatci: values.zadatci,
          odgovori: values.odgovori
        };
        this.updateLekcija(values);
      }
      //izvršava se ako se dodaje nova lekcija ili podtema
      else{
        this.dodajLekciju(values);
      }
      alert("Uspješno ste spremili u bazu!");
      this.dizajner.changeContent('dl');
    }
  }
}
