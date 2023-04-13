import { Component } from '@angular/core';
import { getDocs, query, collection, where, doc, deleteDoc, getDoc } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';
import { MatDialog } from '@angular/material/dialog';
import { ZadatakComponent } from '../zadatak/zadatak.component';
import { getStorage, ref, deleteObject } from "firebase/storage";
import Swal from 'sweetalert2';

//funkcija za čitanje više dokumenata
async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let result = [];
  const allDocs = querySnapshot.forEach((snap) => {
    let newObject = Object.assign({}, snap.data(), { unique_id: snap.id });
    result.push(newObject); 
  });
  return result;
}

@Component({
  selector: 'app-dizajner-lekcija',
  templateUrl: './dizajner-lekcija.component.html',
  styleUrls: ['./dizajner-lekcija.component.css'],
})

export class DizajnerLekcijaComponent {
  constructor(private firebaseSevice: FirebaseService, private designer: DizajnerPocetnoComponent, private actionService: RadnjaService, private dialog: MatDialog) { }
  db = this.firebaseSevice.getDb();
  showTasks = false;


  themes$ = queryForDocuments(collection(this.db, '/lection')).then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));

  selectedTheme: string = "0";
  selectedSubtheme: string = "0";
  selectedSubject: string;
  selectedClass: number;
  selectedType: string;
  subthemes;
  path: string;
  tasks;

  //nova lekcija
  addLection(content: string) {
    this.designer.changeContent(content);
    this.actionService.action = 'lection';
  }

  //odabir teme
  async onThemeSelected() {
    const docRef = doc(this.db, "lection", this.selectedTheme);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      this.selectedSubject = docSnap.data()['subject'];
    }
    
    this.tasks = null;
    this.selectedSubtheme = "0";
    this.showTasks = false;
    this.getSubthemeByTheme();
  }

  //filter po predmetima
  subjectFilter: string[] = [];

  onSubjectFilterChange(event) {
    if (event.target.checked) {
      this.subjectFilter.push(event.target.id);
    } else {
      this.subjectFilter = this.subjectFilter.filter(item => item !== event.target.id);
    }
    this.resetThemes();
  }

  resetThemes() {
    if(this.subjectFilter.length > 0){
      this.themes$ = queryForDocuments(collection(this.db, '/lection'))
      .then(res => res.filter(item => this.subjectFilter.includes(item.subject)))
      .then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
    }
    else {
      this.themes$ = queryForDocuments(collection(this.db, '/lection'))
      .then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
    }
    this.selectedTheme = "0";
    this.subthemes = [];
  }

  //filter po razredima
  classFilter: number[] = [];

  onClassFilterChange(event){
    if (event.target.checked) {
      this.classFilter.push(Number(event.target.id));
    } else {
      this.classFilter = this.classFilter.filter(item => item !== Number(event.target.id));
    }
    this.resetSubthemes();
  }

  async resetSubthemes() {
    if(this.classFilter.length > 0){
      this.subthemes = await queryForDocuments(collection(this.db, `/lection/${this.selectedTheme}/subtheme`))
      .then(res => res.filter(item => this.classFilter.includes(item.class)))
      .then(res => res.sort((a, b) => a.title.localeCompare(b.title)));
    }
    else {
      this.subthemes = await queryForDocuments(collection(this.db, `/lection/${this.selectedTheme}/subtheme`))
      .then(res => res.sort((a, b) => a.title.localeCompare(b.title)));
    }
    this.selectedSubtheme = "0";
  }

  //dohvaćanje podtema za odabranu temu
  async getSubthemeByTheme() {
    this.path = `/lection/${this.selectedTheme}/subtheme`;
    this.subthemes = await queryForDocuments(collection(this.db, this.path));
    this.subthemes = this.subthemes.sort((a, b) => a.title.localeCompare(b.title));
  }

  //odabir podteme
  async onPodtemaSelected() {
    const docRef = doc(this.db, 'lection', this.selectedTheme, 'subtheme', this.selectedSubtheme);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      this.selectedClass = docSnap.data()['class'];
      this.selectedType = docSnap.data()['type'];
    }

    this.getTasksBySubtheme();
  }

  //dohvaćanje zadataka za odabranu temu i podtemu
  async getTasksBySubtheme() {
    const tasks = await queryForDocuments(collection(this.db, `/lection/${this.selectedTheme}/subtheme/${this.selectedSubtheme}/task`));
    this.tasks = tasks;
    this.showTasks = true;
  }

  addSubtheme(content: string) {
    this.designer.changeContent(content);
    this.actionService.action = 'subtheme';
    this.actionService.selectedTheme['id'] = this.selectedTheme;
    const option = document.querySelector(`option[value="${this.selectedTheme}"]`);
    this.actionService.selectedTheme['theme'] = option.textContent;
    this.actionService.selectedTheme['subject'] = this.selectedSubject;
  }

  async deleteSubthemeAndTasks(subthemeRef: any) {
    const tasksRef = collection(subthemeRef, "task");
    const snapshot = await getDocs(tasksRef);

    snapshot.forEach(async (doc) => {
      const answerRef = collection(doc.ref, "answer");
      const answerSnapshot = await getDocs(answerRef);

      //potrebno za brisanje slika
      let ans = await queryForDocuments(answerRef);

      //brisanje slika
      for (const a of ans) {
        if (a.image){
          const storage = getStorage();
          const imageRef = ref(storage, a.image);
          deleteObject(imageRef).then(() => {
            // File deleted successfully
          }).catch((error) => {
            // Uh-oh, an error occurred!
          });
        }
      }
      
      answerSnapshot.forEach((answerDoc) => {
        deleteDoc(answerDoc.ref);
      });
      
      deleteDoc(doc.ref);
    });

    deleteDoc(subthemeRef);
  }

  async reset(theme: boolean) {
    this.tasks = null;
    this.selectedSubtheme = "0";
    this.showTasks = false;

    if (theme){
      this.themes$ = queryForDocuments(collection(this.db, '/lection')).then(res => res);
      this.selectedTheme = "0";
      this.subthemes = null;
    }
    else {
      this.getSubthemeByTheme();
    }
  }
  
  async confirmFunction(message: string) {
    let confirm = false;
    const result = await Swal.fire({
      title: message,
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

    return confirm;
  }

  async deleteSubtheme() {
    const optionSubtheme = document.querySelector(`option[value="${this.selectedSubtheme}"]`);
    let confirm = await this.confirmFunction('Jeste li sigurni da želite obrisati podtemu "' + optionSubtheme.textContent + '"?');
    if (confirm) {
      const themeRef = doc(this.db, "lection", this.selectedTheme);
      const subthemeRef = doc(themeRef, "subtheme", this.selectedSubtheme);
      this.deleteSubthemeAndTasks(subthemeRef); 
      this.reset(false);
    } 
  }

  async deleteTheme() {
    const optionTheme = document.querySelector(`option[value="${this.selectedTheme}"]`);
    let confirm = await this.confirmFunction('Jeste li sigurni da želite obrisati temu "' + optionTheme.textContent + '" i sve njezine podteme?');
    if (confirm) {
      const themeRef = doc(this.db, "lection", this.selectedTheme);
      
      const subthemeRef = collection(themeRef, "subtheme");
      const snapshot = await getDocs(subthemeRef);

      snapshot.forEach(async (doc) => {
        this.deleteSubthemeAndTasks(doc.ref);   
      });
      
      deleteDoc(themeRef);

      this.reset(true);
    } 
  }

  editLection(content: string) {
    this.actionService.action = 'edit';
    this.actionService.selectedTheme['id'] = this.selectedTheme;
    const optionTheme = document.querySelector(`option[value="${this.selectedTheme}"]`);
    this.actionService.selectedTheme['theme'] = optionTheme.textContent;
    this.actionService.selectedTheme['subject'] = this.selectedSubject;
    this.actionService.selectedSubtheme['id'] = this.selectedSubtheme;
    const optionSubtheme = document.querySelector(`option[value="${this.selectedSubtheme}"]`);
    this.actionService.selectedSubtheme['title'] = optionSubtheme.textContent;
    this.actionService.selectedSubtheme['class'] = this.selectedClass;
    this.actionService.type = this.selectedType;
    this.designer.changeContent(content);
  }

  //pop up prozor za zadatke
  openDialog(task): void {
    const dialogRef = this.dialog.open(ZadatakComponent, {
      width: '40em',
      data: {
        task: task,
        subtheme: this.selectedSubtheme,
        theme: this.selectedTheme
      }
    });
  }
}