import { Component, ElementRef, ViewChild } from '@angular/core';
import { FirebaseService } from '../services/firebase-service.service';
import { collection, addDoc, writeBatch, doc, getDocs, getDoc, updateDoc, deleteDoc, collectionGroup, query, where } from "firebase/firestore";
import { FormGroup, FormArray, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { RadnjaService } from '../services/radnja.service';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";

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
  return formArray;
}

@Component({
  selector: 'app-nova-lekcija',
  templateUrl: './nova-lekcija.component.html',
  styleUrls: ['./nova-lekcija.component.css']
})
export class NovaLekcijaComponent {
  constructor(private firebaseService: FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) { }
  db = this.firebaseService.getDb();
  popisSlika = [];
  @ViewChild('naslov', {static: true}) naslovElement: ElementRef;
  @ViewChild('gumb', {static: true}) gumbElement: ElementRef;

  isDisabled = false;

  ngOnInit(): void {
    //ako dodajemo podtemu unutar postojeće teme
    if(this.radnjaService.radnja === 'podtema') {
      this.isDisabled = true;
      this.lekcijaForma.get('tema').setValue(this.radnjaService.odabranaTema['tema']);
      document.querySelector("#tema").setAttribute("readonly", "true");
      this.lekcijaForma.get('predmet').setValue(this.radnjaService.odabranaTema['predmet']);
      setTimeout(() => {
        document.querySelector(".predmet").setAttribute("readonly", "true");
      }, 200);
      this.naslovElement.nativeElement.innerText = 'Nova podtema';
      this.gumbElement.nativeElement.innerText = 'Dodaj podtemu';
    }
    
    //ako uređujemo postojuću lekciju
    else if (this.radnjaService.radnja === 'uredi'){
      this.naslovElement.nativeElement.innerText = 'Uredi lekciju';
      this.gumbElement.nativeElement.innerText = 'Spremi promjene';
      //dodavanje teme i podteme u FormGroup
      this.lekcijaForma.get('tema').setValue(this.radnjaService.odabranaTema['tema']);
      this.lekcijaForma.get('predmet').setValue(this.radnjaService.odabranaTema['predmet']);
      this.lekcijaForma.get('podtema').setValue(this.radnjaService.odabranaPodtema['naziv']);
      this.lekcijaForma.get('razred').setValue(this.radnjaService.odabranaPodtema['razred']);
      this.lekcijaForma.get('odgovorTip').setValue(this.radnjaService.odgovorTip);

      //dohavaćanje zadataka i odgovora
      this.getPopisZadatakaOdgovora();
    }
  }
  
  async getPopisZadatakaOdgovora() {
    document.body.style.cursor = 'wait';

    let popisZadataka = [];
    let popisOdgovora = [];
    let zadatci = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak`));
    
    //dohvaćanje zadataka i odgovora
    for (const zadatak of zadatci) {
      popisZadataka.push(zadatak.tekst_zadatka);
      let odgovori = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak/${zadatak.unique_id}/Odgovor`));
      
      let odgovori2 = [];
      //ako je tip odgovora tekst
      if (this.radnjaService.odgovorTip === "tekst") {
        odgovori.forEach(odgovor => {
          odgovori2.push(odgovor.tekst_odgovora);
        });
      }
      else if (this.radnjaService.odgovorTip === "slika") {
        odgovori.forEach(odgovor => {
          odgovori2.push(odgovor.slika);
        });
      }
      popisOdgovora.push(odgovori2);
    }
 
    //dodavanje zadataka u FormGroup
    const formArray = this.lekcijaForma.get('zadatci') as FormArray;
    formArray.clear();
    popisZadataka.forEach(zadatak => formArray.push(new FormControl(zadatak, Validators.required)));

    //dodavanje odgovora u FormGroup
    const formArray2 = this.lekcijaForma.get('odgovori') as FormArray;
    formArray2.clear(); 
    //ako je tip odgovora tekst 
    if (this.radnjaService.odgovorTip === "tekst") {
      popisOdgovora.forEach(odgovori => {
        const odgovoriFormArray = new FormArray([]);
        odgovori.forEach(odgovor => odgovoriFormArray.push(new FormControl(odgovor, {
          validators: Validators.required,
          updateOn: 'change'
        })));
        formArray2.push(odgovoriFormArray);
      });
    }
    //ako je tip odgovora slika
    else if (this.radnjaService.odgovorTip === "slika") {
      this.popisSlika = await this.waitUntilDataLoaded(popisOdgovora);
      popisOdgovora.forEach(odgovori => {
        const odgovoriFormArray = new FormArray([]);
        formArray2.push(odgovoriFormArray);
      });
    }

    document.body.style.cursor = 'default';
  }  

  async waitUntilDataLoaded(popisOdgovora) {
    let popisSlika = [];
  
    // koristimo Promise.all() za čekanje dok se sve slike ne učitaju
    await Promise.all(popisOdgovora.map(async (odgovori, index) => {
      const slike = [];
      for (const odgovor of odgovori) {
        const storage = getStorage();
        const url = await getDownloadURL(ref(storage, odgovor));
        slike.push(url);
      }
      popisSlika[index] = slike;
    }));
    
    return popisSlika;
  }

  //može biti najviše 4 vrste zadatka jer se tablet dijeli na max. 4 učenika
  maxZadataka = 4;

  lekcijaForma = new FormGroup({
    tema: new FormControl('', [Validators.required]),
    predmet: new FormControl('0', [Validators.required, this.nonZero]),
    podtema: new FormControl('', Validators.required),
    razred: new FormControl(0, [Validators.required, this.nonZero]),
    zadatci: new FormArray([
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      }),
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      })
    ]),
    odgovorTip: new FormControl('tekst', Validators.required),
    odgovori: new FormArray([
      new FormArray([
        new FormControl('', {
          validators: Validators.required,
          updateOn: 'change'
        })
      ]),
      new FormArray([
        new FormControl('', {
          validators: Validators.required,
          updateOn: 'change'
        })
      ])
    ])
  }, { validators: [this.duplicateZadatakValidator, this.duplicateOdgovoriValidator] }); 

  //custom validator za provjeru da tema već ne postoji - NE RADI KAKO TREBA!!!!!!!!
  nonExist(control: AbstractControl) {
    //let res = await queryForDocuments(collection(db, '/lekcija')); - DODATI async nonExist(db:any, control: AbstractControl) i u pozivu funkcije this.nonExist.bind(this, this.db)

    //let teme = res.map(lekcija => lekcija.tema);
    //console.log(teme);
    //DODATI I NEŠTO DA SE TO NE PROVJERAVA AKO JE UPDATE
    if(this.radnjaService.radnja === 'uredi'){
      return null;
    } else {
      let teme = ['Prehrana', 't', 'Pisanje riječi', 'Operatori'];

      if (teme.includes(control.value)) {
        return {
          nonExist: true
        };
      } else {
        return null;
      }
    }
  }

  //custom validator za provjeru da su odabrani predmet i razred
  nonZero(control: FormControl) {
    if (control.value == '0') {
      return {
        nonZero: true
      };
    }
    return null;
  }

  //custom validator da ne postoje dva ista zadatka
  duplicateZadatakValidator(form: FormGroup) {
    const zadatci = form.get('zadatci') as FormArray;
    const zadaci = zadatci.controls.map(zadatak => zadatak.value);

    const duplicates = zadaci.filter((zadatak, index) => zadaci.indexOf(zadatak) !== index);
    
    zadatci.controls.forEach((zadatak, index) => {
      if (zadatak.value === '') {
        // Ako je kontrola prazna, postavite grešku da je obavezna
        zadatak.setErrors({ required: true });
      } else {
        const duplicate = duplicates.includes(zadatak.value);
        const errors = duplicate ? { duplicate: true } : null;
        zadatak.setErrors(errors);
      }
    });
    
    return null;
  }

  //custom validator da ne postoje dva ista odgovora
  //DODATI DA SE PROVJERAVA I DA NE POSTOJE VEĆ ISTE SLIKE U BAZI!!!!!!!!!!!
  duplicateOdgovoriValidator(form: FormGroup){
    const odgovori = form.get('odgovori') as FormArray;
    const values = [];

    odgovori.controls.forEach((odgovorGroup: FormArray) => {
      odgovorGroup.controls.forEach((control: FormControl) => {
        values.push(control.value);
      });
    });

    const duplicates = values.filter((value, index, array) => array.indexOf(value) !== index);

    odgovori.controls.forEach((odgovorGroup: FormArray) => {
      odgovorGroup.controls.forEach((control: FormControl) => {
        if (control.value === '') {
          // Ako je kontrola prazna, postavite grešku da je obavezna
          control.setErrors({ required: true });
        } else {
          const duplicate = duplicates.includes(control.value);
          const errors = duplicate ? { duplicate: true } : null;
          control.setErrors(errors);
        }
      });
    });

    return null;
  }

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
    this.zadatci.push(new FormControl('', {
      validators: Validators.required,
      updateOn: 'change'
    }));
    const odgovoriZaNoviZadatak = new FormArray([
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      })
    ]);
    this.odgovori.push(odgovoriZaNoviZadatak);
  }

  async removeZadatak(i: number) {
    //provjera ako se radi o lekciji koja se uređuje, ima odgovore tipa slika i želi se obrisati zadatak koji je ranije postojao
    if(this.radnjaService.radnja === "uredi" && this.radnjaService.odgovorTip === "slika" && this.popisSlika[i]){
      console.log("tu sam");
      const podtemaRef = doc(this.db, `lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}`);
      const zadaciRef = collection(podtemaRef, "Zadatak");
      const q = query(zadaciRef, where("tekst_zadatka", "==", this.zadatci.controls[i].value));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const odgovorRef = collection(doc.ref, "Odgovor");
        const odgovorSnapshot = await getDocs(odgovorRef);

        //potrebno za brisanje slika
        let odg = await queryForDocuments(odgovorRef);

        //brisanje slika
        for (const o of odg) {
          if (o.slika){
            const storage = getStorage();
            const slikaRef = ref(storage, o.slika);
            deleteObject(slikaRef);
          }
        }

        odgovorSnapshot.forEach((odgovorDoc) => {
          deleteDoc(odgovorDoc.ref);
        });
        
        deleteDoc(doc.ref);
      });
    }
    
    this.zadatci.removeAt(i);
    this.odgovori.removeAt(i);
  }
  
  addOdgovor(index: number) {
    this.getOdgovori(index).push(new FormControl('', {
      validators: Validators.required,
      updateOn: 'change'
    }));
  }

  removeOdgovor(i: number, j: number) {
    this.getOdgovori(i).removeAt(j);
  }

  async removeImage(slikaUrl: string) {
    document.body.style.cursor = "wait";
    
    const potvrda = confirm('Jeste li sigurni da želite obrisati sliku?');

    if(potvrda){
      const storage = getStorage();
      const slikaRef = ref(storage, slikaUrl);
      const path = slikaRef['_location'].path;

      //dohvaćanje dokumenta gdje se nalazi slika i brisanje tog dokumenta
      let zadatci = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak`));

      for (const zadatak of zadatci) {
        let odgovori = await queryForDocuments(collection(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak/${zadatak.unique_id}/Odgovor`));
        
        for (const odgovor of odgovori){
          if(odgovor.slika.includes(path)){
            const docRef = doc(this.db, `/lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}/Zadatak/${zadatak.unique_id}/Odgovor/${odgovor.unique_id}`);
            await deleteDoc(docRef);
          }
        }
      }

      //brisanje slike iz storage-a i micanje slike iz popisaSlika
      deleteObject(slikaRef).then(() => {
        // File deleted successfully
        this.popisSlika = this.popisSlika.map((slike, i) => {
          if (slike.length == 1){
            return slike.map(polje => {
              if (polje === slikaUrl) {
                //dodavanje praznog inputa jer mora biti barem jedan odgovor
                const odgovoriFormArray = this.lekcijaForma.get('odgovori') as FormArray;
                const drugiNiz = odgovoriFormArray.at(i) as FormArray;
                drugiNiz.push(new FormControl('', {
                  validators: Validators.required,
                  updateOn: 'change'
                }));

                return "";
              } else {
                return polje;
              }
            });
          }
          else {
            return slike.filter(polje => {
              if (polje !== slikaUrl) {
                return polje;
              }
            });
          }
        });
      }).catch((error) => {
        console.log("greška");
      });
    }
    
    document.body.style.cursor = "default";
  }
  
  //funkcija za dodavanje u bazu
  async dodajLekciju(values: any) {
    //provjerava se prvo jel se dodaje lekcija ili podtema u postojeću lekciju
    let podtemaRef;
    if(this.radnjaService.radnja === 'lekcija'){
      const lekcijaRef = await addDoc(collection(this.db, "lekcija"), {
        tema: values.tema,
        predmet: values.predmet
      });
      
      podtemaRef = await addDoc(collection(lekcijaRef, "Podtema"), {
        naziv: values.podtema,
        razred: Number(values.razred),
        odgovorTip: values.odgovorTip
      });
    }
    else if (this.radnjaService.radnja === 'podtema'){
      podtemaRef = await addDoc(collection(this.db, `lekcija/${this.radnjaService.odabranaTema['id']}/Podtema`), {
        naziv: values.podtema,
        razred: Number(values.razred),
        odgovorTip: values.odgovorTip
      });
    }    
    this.dodajZadatkeOdgovore(values, podtemaRef);
  } 
  
  async dodajZadatkeOdgovore (values: any, podtemaRef: any){
    const zadatciObjekti = values.zadatci.map(zadatak => ({ tekst_zadatka: zadatak }));
    let odgovoriObjekti;
    
    //provjerava se radi li se o slikama - ako da prvo se sve slike stavljaju u cloud storage
    if(values.odgovorTip === "slika"){
      console.log("dodajem slike");
      const storage = getStorage();
      const files = await Array.from(document.querySelectorAll("input[type='file']")).map(doc => doc['files']);
      await files.forEach(file => {
        const name = file[0].name
          .replace(/č/g, 'cj')
          .replace(/ć/g, 'tj')
          .replace(/ž/g, 'zj')
          .replace(/š/g, 'sj')
          .replace(/đ/g, 'dj');
        const storageRef = ref(storage, `${values.tema}/${values.podtema}/${name}`);

        uploadBytes(storageRef, file[0]).then((snapshot) => {
        });
      })
      odgovoriObjekti = values.odgovori.map(red => red.map(odgovor => ({ slika: ref(storage, `${values.tema}/${values.podtema}/${odgovor}`).toString() }))); 
    }
    else {
      odgovoriObjekti = values.odgovori.map(red => red.map(odgovor => ({ tekst_odgovora: odgovor })));
    }    
    const batch = writeBatch(this.db);

    zadatciObjekti.forEach((zadatak, index) => {
      console.log("dodajem zadatke i odgovore");
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
    temaData['predmet'] = values.predmet;
    await updateDoc(temaRef, temaData);

    //update podteme
    const podtemaRef = doc(temaRef, "Podtema", this.radnjaService.odabranaPodtema['id']);
    const docSnap2 = await getDoc(podtemaRef);
    const podtemaData = docSnap2.data();
    podtemaData['naziv'] = values.podtema;
    podtemaData['razred'] = values.razred;
    let promjena = '';
    if (podtemaData['odgovorTip'] === "tekst" && values.odgovorTip === "slika"){
      promjena = "dodaj slike";
    }
    else if (podtemaData['odgovorTip'] === "slika" && values.odgovorTip === "tekst") {
      promjena = "obriši slike";
    }
    podtemaData['odgovorTip'] = values.odgovorTip;
    await updateDoc(podtemaRef, podtemaData);
    console.log(promjena, values.odgovorTip);

    //update zadataka i odgovora
    if ((promjena === '' && values.odgovorTip === "tekst" ) || (promjena === "dodaj slike" && values.odgovorTip === "slika" )){
      //prvo obriši trenutne zadatke i odgovore
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

      console.log("obrisano staro");
      //dodaj nove zadatke i odgovore
      this.dodajZadatkeOdgovore(values, podtemaRef);
    }
    else if (promjena === '' && values.odgovorTip === "slika"){
      console.log("isti tip - slika");
      const zadaciRef = collection(podtemaRef, "Zadatak");
      const snapshot = await getDocs(zadaciRef);

      if (snapshot.size <= values.odgovori.length){
        console.log("ista veličina");
        let i = 0;
        for (i; i < snapshot.docs.length; i++) {
            //update teksta zadataka
            const doc = snapshot.docs[i];
            const zadatakData = doc.data();
            zadatakData['tekst_zadatka'] = values.zadatci[i];
            await updateDoc(doc.ref, zadatakData);
               
            //dodavanje novih slika ako postoje
            if (values.odgovori[i].length > 0) {
              const odgovorRef = collection(doc.ref, "Odgovor");
              const odgovorSnapshot = await getDocs(odgovorRef);
                 
              let ime;

              //dodavanje u storage
              const storage = getStorage();
              const files = await Array.from(document.querySelectorAll(`input[type='file'][id^='z${i}']`)).map(doc => doc['files']);
              const uploadPromises = files.map(file => {
                ime = file[0].name
                  .replace(/č/g, 'cj')
                  .replace(/ć/g, 'tj')
                  .replace(/ž/g, 'zj')
                  .replace(/š/g, 'sj')
                  .replace(/đ/g, 'dj');
                
                let i = 0;
                let postoji = false;
                do {
                  if (postoji && i != 0) {
                    ime = ime.substring(0, ime.lastIndexOf(".")) + i + ime.substring(ime.lastIndexOf("."));
                  }
                  else {
                    i++;
                  }
                  postoji = this.popisSlika.some(slikaGrupa => {
                    return slikaGrupa.some(slika => {
                      return slika.includes(ime)});
                  });
                } while (postoji)

                const storageRef = ref(storage, `${values.tema}/${values.podtema}/${ime}`);
              
                return uploadBytes(storageRef, file[0]);
              });
            
              await Promise.all(uploadPromises);

              //dodavanje u bazu
              let odgovoriObjekti = values.odgovori[i].map(odgovor => ({ slika: ref(storage, `${values.tema}/${values.podtema}/${ime}`).toString() })); 

              odgovoriObjekti.forEach(odgovor => {
                const docRef = addDoc(collection(doc.ref, "Odgovor"), odgovor);
              });
            }
          }
          if (snapshot.size < values.odgovori.length) {
            console.log("imamo više odgovora - treba ih dodati");

            let newValues = {...values};

            newValues['odgovori'] = values['odgovori'].slice(i);
            newValues['zadatci'] = values['zadatci'].slice(i);

            this.dodajZadatkeOdgovore (newValues, doc(temaRef, "Podtema", this.radnjaService.odabranaPodtema['id']));
          }
      }
    }
    else if (promjena === "obriši slike") {
      const zadaciRef = collection(podtemaRef, "Zadatak");
      const snapshot = await getDocs(zadaciRef);

      snapshot.forEach(async (doc) => {
        const odgovorRef = collection(doc.ref, "Odgovor");
        const odgovorSnapshot = await getDocs(odgovorRef);

        //potrebno za brisanje slika
        let odg = await queryForDocuments(odgovorRef);

        //brisanje slika
        for (const o of odg) {
          if (o.slika){
            const storage = getStorage();
            const slikaRef = ref(storage, o.slika);
            deleteObject(slikaRef).then(() => {
              console.log("obrisana slika");
            }).catch((error) => {
              console.log("nije obrisano");
            });
          }
        }
        
        odgovorSnapshot.forEach((odgovorDoc) => {
          deleteDoc(odgovorDoc.ref);
        });
        
        deleteDoc(doc.ref);
      });

      //dodaj zadatke i odgovore
      this.dodajZadatkeOdgovore(values, podtemaRef);
    }
  }

  //pobriši odgovore i dodaj prazne ovisno o broju zadataka
  prethodnaVrijednost = "tekst";
  async resetOdgovori() {
    //ako se dodaje nova lekcija ili podtema
    if (this.radnjaService.radnja !== "uredi"){
      let puno = false;
      const odgovori = this.lekcijaForma.get('odgovori').value;
      odgovori.forEach(odgovor => {
        odgovor.forEach(o => {
          if (o != ''){
            puno = true;
          }
        })
      });
      let potvrda = true;
      if (puno || this.popisSlika.length > 0){
        potvrda = confirm('Jeste li sigurni da želite promijeniti tip odgovora i obrisati sve prethodno unesene odgovore?');
      }
      else {
        potvrda = true;
      }

      if (potvrda) {
        this.prethodnaVrijednost = this.lekcijaForma.get('odgovorTip').value;
        const trenutniBrojOdgovora = this.lekcijaForma.get('zadatci').value.length;
        const noviOdgovori = new FormArray([]);
        for (let i = 0; i < trenutniBrojOdgovora; i++) {
          noviOdgovori.push(new FormArray([new FormControl('', Validators.required)]));
        }
        this.lekcijaForma.setControl('odgovori', noviOdgovori);
      } else {
        this.lekcijaForma.get('odgovorTip').setValue(this.prethodnaVrijednost);
      }
    }
    //ako se uređuje postojeća lekcija
    else {
      //PROMIJENITI TAKO DA SE I OBRIŠU DOKUMENTI I SLIKE!!!!!!!!!!!!!!!!
      let puno = false;
      const odgovori = this.lekcijaForma.get('odgovori').value;
      odgovori.forEach(odgovor => {
        odgovor.forEach(o => {
          if (o != ''){
            puno = true;
          }
        })
      });
      let potvrda = true;
      if (puno || this.popisSlika.length > 0){
        potvrda = confirm('Jeste li sigurni da želite promijeniti tip odgovora i obrisati sve prethodno unesene odgovore?');
      }
      else {
        potvrda = true;
      }

      if (potvrda) {
        const podtemaRef = doc(this.db, `lekcija/${this.radnjaService.odabranaTema['id']}/Podtema/${this.radnjaService.odabranaPodtema['id']}`);
        const zadaciRef = collection(podtemaRef, "Zadatak");
        const snapshot = await getDocs(zadaciRef);

        snapshot.forEach(async (doc) => {
          console.log(doc);
          const odgovorRef = collection(doc.ref, "Odgovor");
          const odgovorSnapshot = await getDocs(odgovorRef);

          if (this.popisSlika.length > 0) {
            //potrebno za brisanje slika
            let odg = await queryForDocuments(odgovorRef);

            //brisanje slika
            for (const o of odg) {
              if (o.slika){
                const storage = getStorage();
                const slikaRef = ref(storage, o.slika);
                deleteObject(slikaRef).then(() => {
                  // File deleted successfully
                  console.log("obrisana slika");
                }).catch((error) => {
                  // Uh-oh, an error occurred!
                  console.log("error");
                });
              }
            }
          }

          odgovorSnapshot.forEach((odgovorDoc) => {
            deleteDoc(odgovorDoc.ref);
          });
        });

        this.popisSlika = [];
        
        this.prethodnaVrijednost = this.lekcijaForma.get('odgovorTip').value;
        const trenutniBrojOdgovora = this.lekcijaForma.get('zadatci').value.length;
        const noviOdgovori = new FormArray([]);
        for (let i = 0; i < trenutniBrojOdgovora; i++) {
          noviOdgovori.push(new FormArray([new FormControl('', Validators.required)]));
        }
        this.lekcijaForma.setControl('odgovori', noviOdgovori);
      } else {
        this.lekcijaForma.get('odgovorTip').setValue(this.prethodnaVrijednost);
      }
    }
    
  }

  async save() {
    if (this.lekcijaForma.invalid) {
      this.lekcijaForma.markAllAsTouched();
      return;
    }
    else {
      document.body.style.cursor = 'wait';
      const values = this.lekcijaForma.value;
      if (values.odgovorTip === "slika") {
        //mijenjanje da dobijem samo ime slike i zamijenim dijakritike radi lakše provjere kasnije
        values.odgovori = values.odgovori.map(red => red.map(odgovor => odgovor
          .split('\\').pop()
          .replace(/č/g, 'cj')
          .replace(/ć/g, 'tj')
          .replace(/ž/g, 'zj')
          .replace(/š/g, 'sj')
          .replace(/đ/g, 'dj')
        ));
      }

      //dodavanje u bazu
      //dodavanje u bazu i povratak na moje lekcije
      //provjerava se uređuje li se postojeća lekcija
      if(this.radnjaService.radnja === 'uredi'){
        const updatedData = {
          tema: values.tema,
          podtema: values.podtema,
          odgovorTip: values.odgovorTip,
          predmet: values.predmet,
          razred: values.razred,
          zadatci: values.zadatci,
          odgovori: values.odgovori
        };
        await this.updateLekcija(values);
      }
      //izvršava se ako se dodaje nova lekcija ili podtema
      else{
        await this.dodajLekciju(values);
      }
      document.body.style.cursor = 'default';
      
      alert("Uspješno ste spremili u bazu!");
      setTimeout(() => {
        this.dizajner.changeContent('dl');
      }, 1000);
    }
  }
}
