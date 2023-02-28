import { Component } from '@angular/core';
import { FirebaseService } from '../services/firebase-service.service';
import { collection, addDoc, writeBatch, doc, getDocs } from "firebase/firestore";
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';


async function nadiNajveci(new_query, componentInstance) {
  const querySnapshot = await getDocs(new_query);
  let maxIdLekcije = 0;
  querySnapshot.forEach((snap) => {
    console.log("u funkciji trenutni id: " + snap.data()['id'] + "maxId: " + maxIdLekcije)
    if(snap.data()['id'] > maxIdLekcije){
      maxIdLekcije = snap.data()['id'];
    } 
  });
  return maxIdLekcije;
}

@Component({
  selector: 'app-nova-lekcija',
  templateUrl: './nova-lekcija.component.html',
  styleUrls: ['./nova-lekcija.component.css']
})
export class NovaLekcijaComponent {
  constructor(private firebaseSevice: FirebaseService) { }
  db = this.firebaseSevice.getDb();

  maxZadataka = 4;

  lekcijaForma = new FormGroup({
    tema: new FormControl('', Validators.required),
    podtema: new FormControl('', Validators.required),
    zadatci: new FormArray([
      new FormControl('', Validators.required),
      new FormControl('', Validators.required)
    ]),
    odgovorTip: new FormControl('tekst', Validators.required),
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
  /*async dodajLekciju(values: {
    tema: string;
    podtema: string;
    zadatci: string[];
    odgovori: string[][];
  }) {
    
    
    const lekcijaRef = await addDoc(collection(this.db, "lekcija"), {
      id: 2,
      tema: "operatori"
    });
    
    const podtemeRef = await addDoc(collection(lekcijaRef, "Podtema"), {
      id: 2,
      id_lekcije: 2,
      naziv: "veće i manje"
    });
    
    const noviZadatci = [
      { id: 3, id_podteme: 2, tekst_zadatka: "Odaberi zadatke u koje možeš upisati znak <." },
      { id: 4, id_podteme: 2, tekst_zadatka: "Odaberi zadatke u koje možeš upisati znak >." }
    ];

    const batch = writeBatch(this.db);

    noviZadatci.forEach(zadatak => {
      const noviZadatakRef = doc(collection(podtemeRef, 'Zadatak'));
      batch.set(noviZadatakRef, zadatak);
    });

    await batch.commit();

    console.log("Document written with ID: ", lekcijaRef.id);
  }*/


  save() {
    if (this.lekcijaForma.invalid) {
      console.log('Molimo ispunite sva obavezna polja.');
      this.lekcijaForma.markAllAsTouched();
      return;
    }
    else {
      const values = this.lekcijaForma.value;
      console.log(values);

      //dodavanje u bazu
      let max = nadiNajveci(collection(this.db, '/lekcija'), this).then(res => {
        console.log(res);
      });
    }
  }

  /*  constructor(private firebaseSevice: FirebaseService) { }
  db = this.firebaseSevice.getDb();

  async dodajLekciju() {
    const lekcijaRef = await addDoc(collection(this.db, "lekcija"), {
      id: 2,
      tema: "operatori"
    });
    
    const podtemeRef = await addDoc(collection(lekcijaRef, "Podtema"), {
      id: 2,
      id_lekcije: 2,
      naziv: "veće i manje"
    });
    
    const noviZadatci = [
      { id: 3, id_podteme: 2, tekst_zadatka: "Odaberi zadatke u koje možeš upisati znak <." },
      { id: 4, id_podteme: 2, tekst_zadatka: "Odaberi zadatke u koje možeš upisati znak >." }
    ];

    const batch = writeBatch(this.db);

    noviZadatci.forEach(zadatak => {
      const noviZadatakRef = doc(collection(podtemeRef, 'Zadatak'));
      batch.set(noviZadatakRef, zadatak);
    });

    await batch.commit();

    console.log("Document written with ID: ", lekcijaRef.id);
  }*/
}
