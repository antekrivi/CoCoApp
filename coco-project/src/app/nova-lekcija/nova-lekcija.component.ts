import { Component, ElementRef, ViewChild } from '@angular/core';
import { FirebaseService } from '../services/firebase-service.service';
import { collection, addDoc, writeBatch, doc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { RadnjaService } from '../services/radnja.service';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import Swal from 'sweetalert2';

async function queryForDocuments(new_query){
  const querySnapshot = await getDocs(new_query);
  let result = [];
  const allDocs = querySnapshot.forEach((snap) => {
    let newObject = Object.assign({}, snap.data(), { unique_id: snap.id });
    result.push(newObject); 
  });
  return result;
}

function formFormArray(taskList: string[]): FormArray {
  const formArray = new FormArray([]);
  for (const task of taskList) {
    formArray.push(new FormControl(task, Validators.required));
  }
  return formArray;
}

@Component({
  selector: 'app-nova-lekcija',
  templateUrl: './nova-lekcija.component.html',
  styleUrls: ['./nova-lekcija.component.css']
})

export class NovaLekcijaComponent {
  constructor(private firebaseService: FirebaseService, private designer: DizajnerPocetnoComponent, private actionService: RadnjaService) { }
  db = this.firebaseService.getDb();
  listImages = [];
  @ViewChild('title', {static: true}) titleElement: ElementRef;
  @ViewChild('button', {static: true}) buttonElement: ElementRef;

  isDisabled = false;
  edit = false;
  themes = [];
  subthemes = [];

  previousValue = "text";
  
  lectionForm = new FormGroup({
    theme: new FormControl('', [Validators.required, this.existThemes.bind(this)]),
    subject: new FormControl('0', [Validators.required, this.nonZero]),
    subtheme: new FormControl('', [Validators.required, this.existSubthemes.bind(this)]),
    class: new FormControl(0, [Validators.required, this.nonZero]),
    tasks: new FormArray([
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      }),
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      })
    ]),
    type: new FormControl('text', Validators.required),
    answers: new FormArray([
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
  }, { validators: [this.duplicateTaskValidator, this.duplicateAnswerValidator.bind(this)] }); 
  
  //može biti najviše 4 vrste zadatka jer se tablet dijeli na max. 4 učenika
  maxTasks = 4;

  async ngOnInit(): Promise<void> {    
    await this.getThemesSubthemes();

    //ako dodajemo podtemu unutar postojeće teme
    if(this.actionService.action === 'subtheme') {
      this.isDisabled = true;
      this.lectionForm.get('theme').setValue(this.actionService.selectedTheme['theme']);
      document.querySelector("#theme").setAttribute("readonly", "true");
      this.lectionForm.get('subject').setValue(this.actionService.selectedTheme['subject']);
      setTimeout(() => {
        document.querySelector(".subject").setAttribute("readonly", "true");
      }, 200);
      this.titleElement.nativeElement.innerText = 'Nova podtema';
      this.buttonElement.nativeElement.innerText = 'Dodaj podtemu';
    }
    
    //ako uređujemo postojuću lekciju
    else if (this.actionService.action === 'edit'){
      this.edit = true;
      this.titleElement.nativeElement.innerText = 'Uredi lekciju';
      this.buttonElement.nativeElement.innerText = 'Spremi promjene';
      //dodavanje teme i podteme u FormGroup
      this.lectionForm.get('theme').setValue(this.actionService.selectedTheme['theme']);
      this.lectionForm.get('subject').setValue(this.actionService.selectedTheme['subject']);
      this.lectionForm.get('subtheme').setValue(this.actionService.selectedSubtheme['title']);
      this.lectionForm.get('class').setValue(this.actionService.selectedSubtheme['class']);
      this.lectionForm.get('type').setValue(this.actionService.type);

      //dohavaćanje zadataka i odgovora
      this.getListTasksAnswers();

      this.previousValue = this.actionService.type;
    }
  }

  async getThemesSubthemes() {
    //dohavaćnje svih trenutnih tema i podtema
    this.themes = await queryForDocuments(collection(this.db, '/lection'));
   
    const subPromises = this.themes.map(async (doc) => {
        const sub = await queryForDocuments(collection(this.db, `/lection/${doc.unique_id}/subtheme`));
        sub.forEach(s => this.subthemes.push(s.title));
    });
    await Promise.all(subPromises);

    this.themes = this.themes.map(theme => theme.theme);

    this.lectionForm.controls['theme'].updateValueAndValidity();
  }

  //custom validator za provjeru da tema već ne postoji
  existThemes(control: AbstractControl) {
    if(!this.isDisabled && !this.edit) {
      if (this.themes.includes(control.value)) {
        return {
          existThemes: true
        };
      }
    }
    return null;
  }

  //custom validator za provjeru da podtema već ne postoji
  existSubthemes(control: AbstractControl) {
    if (!this.edit) {
      if (this.subthemes.includes(control.value)) {
        return {
          existSubthemes: true
        };
      }
    }
    return null;
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
  duplicateTaskValidator(form: FormGroup) {
    const tasks = form.get('tasks') as FormArray;
    const tasks2 = tasks.controls.map(task => task.value);

    const duplicates = tasks2.filter((task, index) => tasks2.indexOf(task) !== index);
    
    tasks.controls.forEach(task => {
      if (task.value === '') {
        // Ako je kontrola prazna, postaviti grešku da je obavezna
        task.setErrors({ required: true });
      } else {
        const duplicate = duplicates.includes(task.value);
        const errors = duplicate ? { duplicate: true } : null;
        task.setErrors(errors);
      }
    });
    
    return null;
  }

  //custom validator da ne postoje dva ista odgovora
  //DODATI DA SE PROVJERAVA I DA NE POSTOJE VEĆ ISTE SLIKE U BAZI!!!!!!!!!!!
  duplicateAnswerValidator(form: FormGroup, control: AbstractControl){
    const answers = form.get('answers') as FormArray;
    const type = form.get('type').value;
    const values = [];

    answers.controls.forEach((answerGroup: FormArray) => {
      answerGroup.controls.forEach((control: FormControl) => {
        values.push(control.value);
      });
    });

    const duplicates = values.filter((value, index, array) => array.indexOf(value) !== index);

    answers.controls.forEach((answerGroup: FormArray) => {
      answerGroup.controls.forEach((control: FormControl) => {
        if (control.value === '') {
          // Ako je kontrola prazna, postaviti grešku da je obavezna
          control.setErrors({ required: true });
        }
        else {
          const duplicate = duplicates.includes(control.value);
          const errors = duplicate ? { duplicate: true } : null;
          control.setErrors(errors);
        }

        if (type === "image") {
            const slika = control.value.split('\\').pop();

            const found = this.listImages.some(sublist => {
              return sublist.some(str => {
                return str.includes(slika);
              });
            });

            if (found) {
              control.setErrors({ existImage: true });
            }
          }
      });
    });

    return null;
  }
  
  async getListTasksAnswers() {
    document.body.style.cursor = 'wait';
    
    let listTasks = [];
    let listAnswers = [];
    let tasks = await queryForDocuments(collection(this.db, `/lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}/task`));
    
    //dohvaćanje zadataka i odgovora
    for (const task of tasks) {
      listTasks.push(task.textTask);
      let answers = await queryForDocuments(collection(this.db, `/lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}/task/${task.unique_id}/answer`));
      
      let answers2 = [];
      
      answers.forEach(answer => {
        answers2.push(answer.text);
      });
      
      listAnswers.push(answers2);
    }
 
    //dodavanje zadataka u FormGroup
    const formArray = this.lectionForm.get('tasks') as FormArray;
    formArray.clear();
    listTasks.forEach(task => formArray.push(new FormControl(task, Validators.required)));

    //dodavanje odgovora u FormGroup
    const formArray2 = this.lectionForm.get('answers') as FormArray;
    formArray2.clear(); 
    //ako je tip odgovora tekst 
    if (this.actionService.type === "text") {
      listAnswers.forEach(answers => {
        const answersFormArray = new FormArray([]);
        answers.forEach(answer => answersFormArray.push(new FormControl(answer, {
          validators: Validators.required,
          updateOn: 'change'
        })));
        formArray2.push(answersFormArray);
      });
    }
    //ako je tip odgovora slika
    else if (this.actionService.type === "image") {
      this.listImages = await this.waitUntilDataLoaded(listAnswers);
      listAnswers.forEach(answers => {
        const answersFormArray = new FormArray([]);
        formArray2.push(answersFormArray);
      });
    }

    document.body.style.cursor = 'default';
  }  

  async waitUntilDataLoaded(listAnswers) {
    let listImages = [];
  
    // koristimo Promise.all() za čekanje dok se sve slike ne učitaju
    await Promise.all(listAnswers.map(async (answers, index) => {
      const images = [];
      for (const answer of answers) {
        const storage = getStorage();
        const url = await getDownloadURL(ref(storage, answer));
        images.push(url);
      }
      listImages[index] = images;
    }));
    
    return listImages;
  }

  get tasks(): FormArray {
    return this.lectionForm.get('tasks') as FormArray;
  }

  get answers(): FormArray {
    return this.lectionForm.get('answers') as FormArray;
  }

  getAnswers(index: number): FormArray {
    return (this.lectionForm.get('answers') as FormArray).at(index) as FormArray;
  }

  addTask() {
    this.tasks.push(new FormControl('', {
      validators: Validators.required,
      updateOn: 'change'
    }));
    const answersForNewTask = new FormArray([
      new FormControl('', {
        validators: Validators.required,
        updateOn: 'change'
      })
    ]);
    this.answers.push(answersForNewTask);
  }

  async removeTask(i: number) {
    Swal.fire({
      title: 'Jeste li sigurni da želite obrisati zadatak i njemu pripadne odgovore?',
      text: "Ne možete vratiti ovaj korak!",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Da, obriši!',
      cancelButtonText: 'Ne, ne želim obrisati!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        //provjera ako se radi o lekciji koja se uređuje, ima odgovore tipa slika i želi se obrisati zadatak koji je ranije postojao
        if(this.actionService.action === "edit" && this.actionService.type === "image" && this.listImages[i]){
          const subthemeRef = doc(this.db, `lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}`);
          const tasksRef = collection(subthemeRef, "task");
          const q = query(tasksRef, where("textTask", "==", this.tasks.controls[i].value));

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (doc) => {
            const answerRef = collection(doc.ref, "answer");
            const answerSnapshot = await getDocs(answerRef);

            await this.deleteImagesStorage(answerRef);

            answerSnapshot.forEach((answerDoc) => {
              deleteDoc(answerDoc.ref);
            });
            
            deleteDoc(doc.ref);
          });

          this.listImages.splice(i, 1);
        }
        
        this.tasks.removeAt(i);
        this.answers.removeAt(i);
      }});
  }

  async deleteImagesStorage(answerRef) {
    //potrebno za brisanje slika
    let ans = await queryForDocuments(answerRef);

    //brisanje slika
    for (const a of ans) {
      if (this.actionService.type === "image"){
        const storage = getStorage();
        const imageRef = ref(storage, a.text);
        deleteObject(imageRef);
      }
    }
  }
  
  addAnswer(index: number) {
    this.getAnswers(index).push(new FormControl('', {
      validators: Validators.required,
      updateOn: 'change'
    }));
  }

  removeAnswer(i: number, j: number) {
    this.getAnswers(i).removeAt(j);
  }

  async removeImage(imageUrl: string) {
    document.body.style.cursor = "wait";
    
    Swal.fire({
      title: 'Jeste li sigurni da želite obrisati sliku?',
      text: "Ne možete vratiti ovaj korak!",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Da, obriši!',
      cancelButtonText: 'Ne, ne želim obrisati!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const storage = getStorage();
        const imageRef = ref(storage, imageUrl);
        const path = imageRef['_location'].path;

        //dohvaćanje dokumenta gdje se nalazi slika i brisanje tog dokumenta
        let tasks = await queryForDocuments(collection(this.db, `/lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}/task`));

        for (const task of tasks) {
          let answers = await queryForDocuments(collection(this.db, `/lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}/task/${task.unique_id}/answer`));
          
          for (const answer of answers){
            if(answer.text.includes(path)){
              const docRef = doc(this.db, `/lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}/task/${task.unique_id}/answer/${answer.unique_id}`);
              await deleteDoc(docRef);
            }
          }
        }

        //brisanje slike iz storage-a i micanje slike iz popisaSlika
        deleteObject(imageRef).then(() => {
          // File deleted successfully
          this.listImages = this.listImages.map((images, i) => {
            if (images.length == 1){
              return images.map(field => {
                if (field === imageUrl) {
                  //dodavanje praznog inputa jer mora biti barem jedan odgovor
                  const answersFormArray = this.lectionForm.get('answers') as FormArray;
                  const secondArray = answersFormArray.at(i) as FormArray;
                  secondArray.push(new FormControl('', {
                    validators: Validators.required,
                    updateOn: 'change'
                  }));

                  return "";
                } else {
                  return field;
                }
              });
            }
            else {
              return images.filter(field => {
                if (field !== imageUrl) {
                  return field;
                }
              });
            }
          });
        }).catch((error) => {
        });
        Swal.fire(
          'Obrisano!',
          'Slika je obrisana.',
          'success'
        )
      }
    })
    document.body.style.cursor = "default";
  }
  
  //funkcija za dodavanje u bazu
  async addLection(values: any) {
    //provjerava se prvo jel se dodaje lekcija ili podtema u postojeću lekciju
    let subthemeRef;
    if(this.actionService.action === 'lection'){
      const lekcijaRef = await addDoc(collection(this.db, "lection"), {
        theme: values.theme,
        subject: values.subject
      });
      
      subthemeRef = await addDoc(collection(lekcijaRef, "subtheme"), {
        title: values.subtheme,
        class: Number(values.class),
        type: values.type
      });
    }
    else if (this.actionService.action === 'subtheme'){
      subthemeRef = await addDoc(collection(this.db, `lection/${this.actionService.selectedTheme['id']}/subtheme`), {
        title: values.subtheme,
        class: Number(values.class),
        type: values.type
      });
    }    
    this.addTasksAnswers(values, subthemeRef);
  } 
  
  async addTasksAnswers (values: any, subthemeRef: any){
    const tasksObjects = values.tasks.map(task => ({ textTask: task }));
    let answersObjects;
    
    //provjerava se radi li se o slikama - ako da prvo se sve slike stavljaju u cloud storage
    if(values.type === "image"){
      const storage = getStorage();
      const files = await Array.from(document.querySelectorAll("input[type='file']")).map(doc => doc['files']);
      await files.forEach(file => {
        const name = file[0].name
          .replace(/č/g, 'cj')
          .replace(/ć/g, 'tj')
          .replace(/ž/g, 'zj')
          .replace(/š/g, 'sj')
          .replace(/đ/g, 'dj');
        const storageRef = ref(storage, `${values.theme}/${values.subtheme}/${name}`);

        uploadBytes(storageRef, file[0]).then((snapshot) => {
        });
      })
      answersObjects = values.answers.map(row => row.map(answer => ({ text: ref(storage, `${values.theme}/${values.subtheme}/${answer}`).toString() }))); 
    }
    else {
      answersObjects = values.answers.map(row => row.map(answer => ({ text: answer })));
    }    
    const batch = writeBatch(this.db);

    tasksObjects.forEach((task, index) => {
      const newTaskRef = doc(collection(subthemeRef, "task"));
      batch.set(newTaskRef, task);
    
      const answers = answersObjects[index];
      answers.forEach(answer => {
        const newAnswerRef = doc(collection(newTaskRef, "answer"));
        batch.set(newAnswerRef, answer);
      });
    });
 
    await batch.commit();
  }
 
  async updateLection(values: any) {
    //update teme
    const themeRef = doc(this.db, "lection", this.actionService.selectedTheme['id']);
    const docSnap = await getDoc(themeRef);
    const themeData = docSnap.data();
    themeData['theme'] = values.theme;
    themeData['subject'] = values.subject;
    await updateDoc(themeRef, themeData);

    //update podteme
    const subthemeRef = doc(themeRef, "subtheme", this.actionService.selectedSubtheme['id']);
    const docSnap2 = await getDoc(subthemeRef);
    const subthemeData = docSnap2.data();
    subthemeData['title'] = values.subtheme;
    subthemeData['class'] = values.class;
    let change = '';
    if (subthemeData['type'] === "text" && values.type === "image"){
      change = "add images";
    }
    else if (subthemeData['type'] === "image" && values.type === "text") {
      change = "delete images";
    }
    subthemeData['type'] = values.type;
    await updateDoc(subthemeRef, subthemeData);

    //update zadataka i odgovora
    if ((change === '' && values.type === "text" ) || (change === "add images" && values.type === "image" )){
      //prvo obriši trenutne zadatke i odgovore
      const tasksRef = collection(subthemeRef, "task");
      const snapshot = await getDocs(tasksRef);

      snapshot.forEach(async (doc) => {
        const answerRef = collection(doc.ref, "answer");
        const answerSnapshot = await getDocs(answerRef);
      
        answerSnapshot.forEach((answerDoc) => {
          deleteDoc(answerDoc.ref);
        });
      
        deleteDoc(doc.ref);
      });

      //dodaj nove zadatke i odgovore
      this.addTasksAnswers(values, subthemeRef);
    }
    else if (change === '' && values.type === "image"){
      const tasksRef = collection(subthemeRef, "task");
      const snapshot = await getDocs(tasksRef);

      if (snapshot.size <= values.answers.length){
        let i = 0;
        for (i; i < snapshot.docs.length; i++) {
            //update teksta zadataka
            const doc = snapshot.docs[i];
            const taskData = doc.data();
            taskData['text'] = values.tasks[i];
            await updateDoc(doc.ref, taskData);
               
            //dodavanje novih slika ako postoje
            if (values.answers[i].length > 0) {
              const answerRef = collection(doc.ref, "answer");
              const answerSnapshot = await getDocs(answerRef);
                 
              let name;

              //dodavanje u storage
              const storage = getStorage();
              const files = await Array.from(document.querySelectorAll(`input[type='file'][id^='t${i}']`)).map(doc => doc['files']);
              const uploadPromises = files.map(file => {
                name = file[0].name
                  .replace(/č/g, 'cj')
                  .replace(/ć/g, 'tj')
                  .replace(/ž/g, 'zj')
                  .replace(/š/g, 'sj')
                  .replace(/đ/g, 'dj');
                
                let i = 0;
                let exist = false;
                do {
                  if (exist && i != 0) {
                    name = name.substring(0, name.lastIndexOf(".")) + i + name.substring(name.lastIndexOf("."));
                  }
                  else {
                    i++;
                  }
                  exist = this.listImages.some(imageGroup => {
                    return imageGroup.some(image => {
                      return image.includes(name)});
                  });
                } while (exist)

                const storageRef = ref(storage, `${values.theme}/${values.subtheme}/${name}`);
              
                return uploadBytes(storageRef, file[0]);
              });
            
              await Promise.all(uploadPromises);

              //dodavanje u bazu
              let answersObjects = values.answers[i].map(answer => ({ text: ref(storage, `${values.theme}/${values.subtheme}/${name}`).toString() })); 

              answersObjects.forEach(answer => {
                const docRef = addDoc(collection(doc.ref, "answer"), answer);
              });
            }
          }
          if (snapshot.size < values.answers.length) {
            let newValues = {...values};

            newValues['answers'] = values['answers'].slice(i);
            newValues['tasks'] = values['tasks'].slice(i);

            this.addTasksAnswers (newValues, doc(themeRef, "subtheme", this.actionService.selectedSubtheme['id']));
          }
      }
    }
    else if (change === "delete images") {
      const tasksRef = collection(subthemeRef, "task");
      const snapshot = await getDocs(tasksRef);

      snapshot.forEach(async (doc) => {
        const answerRef = collection(doc.ref, "answer");
        const answerSnapshot = await getDocs(answerRef);

        await this.deleteImagesStorage(answerRef);
        
        answerSnapshot.forEach((answerDoc) => {
          deleteDoc(answerDoc.ref);
        });
        
        deleteDoc(doc.ref);
      });

      //dodaj zadatke i odgovore
      this.addTasksAnswers(values, subthemeRef);
    }
  }
  
  async isFullAndConfirm() {
    let full = false;
      const answers = this.lectionForm.get('answers').value;
      //provjera ima li nešto u odgovorima
      answers.forEach(answer => {
        answer.forEach(a => {
          if (a != ''){
            full = true;
          }
        })
      });
      let confirm = false;
      if (full || this.listImages.length > 0){
        const result = await Swal.fire({
          title: 'Jeste li sigurni da želite promijeniti tip odgovora i obrisati sve prethodno unesene odgovore?',
          text: "Ne možete vratiti ovaj korak!",
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Da, želim!',
          cancelButtonText: 'Ne, ne želim!'
        });
        
        
        if (result.isConfirmed) {
          confirm = true;
        }
      }
      else {
        confirm = true;
      }

      return confirm;
  }
  
  async resetAnswers() {
    let newValue = this.lectionForm.get('type').value;
      
    this.lectionForm.get('type').setValue(this.previousValue, {emitEvent: false});
    
    let confirm = await this.isFullAndConfirm();

    //ako se dodaje nova lekcija ili podtema
    if (this.actionService.action !== "edit"){
      if (confirm) {
        this.lectionForm.get('type').setValue(newValue, {emitEvent: false});
        this.previousValue = this.lectionForm.get('type').value;
        const currentNumberAnswers = this.lectionForm.get('tasks').value.length;
        const newAnswers = new FormArray([]);
        for (let i = 0; i < currentNumberAnswers; i++) {
          newAnswers.push(new FormArray([new FormControl('', Validators.required)]));
        }
        this.lectionForm.setControl('answers', newAnswers);
      }
    }
    //ako se uređuje postojeća lekcija
    else {
      if (confirm) {
        this.lectionForm.get('type').setValue(newValue, {emitEvent: false});
        let newAnswers = new FormArray([]);
        this.lectionForm.setControl('answers', newAnswers);

        const subthemeRef = doc(this.db, `lection/${this.actionService.selectedTheme['id']}/subtheme/${this.actionService.selectedSubtheme['id']}`);
        const tasksRef = collection(subthemeRef, "task");
        const snapshot = await getDocs(tasksRef);

        snapshot.forEach(async (doc) => {
          const answerRef = collection(doc.ref, "answer");
          const answerSnapshot = await getDocs(answerRef);

          if (this.actionService.type === "image") {
            await this.deleteImagesStorage(answerRef);
          }

          answerSnapshot.forEach((answerDoc) => {
            deleteDoc(answerDoc.ref);
          });
        });

        this.listImages = [];
        
        this.previousValue = this.lectionForm.get('type').value;
        const currentNumberAnswers = this.lectionForm.get('tasks').value.length;
        for (let i = 0; i < currentNumberAnswers; i++) {
          newAnswers.push(new FormArray([new FormControl('', Validators.required)]));
        }
        this.lectionForm.setControl('answers', newAnswers);
      }
    }
  }

  async save() {
    if (this.lectionForm.invalid) {
      this.lectionForm.markAllAsTouched();
      return;
    }
    else {
      document.body.style.cursor = 'wait';
      const values = this.lectionForm.value;
      if (values.type === "image") {
        //mijenjanje da dobijem samo ime slike i zamijenim dijakritike radi lakše provjere kasnije
        values.answers = values.answers.map(row => row.map(answer => answer
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
      if(this.actionService.action === 'edit'){
        const updatedData = {
          theme: values.theme,
          subtheme: values.subtheme,
          type: values.type,
          subject: values.subject,
          class: values.class,
          tasks: values.tasks,
          answers: values.answers
        };
        await this.updateLection(values);
      }
      //izvršava se ako se dodaje nova lekcija ili podtema
      else{
        await this.addLection(values);
      }
      document.body.style.cursor = 'default';
      
      Swal.fire({
        icon: 'success',
        title: 'Uspješno ste spremili u bazu!',
        confirmButtonColor: '#3085d6',
        showConfirmButton: true
      });
      setTimeout(() => {
        this.actionService.action = "";
        this.designer.changeContent('dl');
      }, 1000);
    }
  }
}
