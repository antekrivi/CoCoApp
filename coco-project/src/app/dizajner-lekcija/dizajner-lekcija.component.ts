import { Component } from '@angular/core';
import { getDocs, query, collection, where, doc, deleteDoc, getDoc } from "firebase/firestore";
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';
import { MatDialog } from '@angular/material/dialog';
import { ZadatakComponent } from '../zadatak/zadatak.component';
import { PodtemaComponent } from '../podtema/podtema.component';
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

  themes = [];
  subthemes = [];
  selectedTheme: string = "0";
  selectedSubtheme: string = "0";
  selectedSubject: string;
  selectedClass: number;
  selectedType: string;
  path: string;
  tasks;
  searchTerm: string;

  async ngOnInit() {
    this.themes = await queryForDocuments(collection(this.db, '/lection')).then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
    this.subthemes = await this.getAllSubthemes();
  }

  async getAllSubthemes(){
    document.body.style.cursor = "wait";

    let themes = await queryForDocuments(collection(this.db, '/lection'));
    let subthemes = [];

    if(this.subjectFilter.length > 0){
      themes = themes.filter(item => this.subjectFilter.includes(item.subject));
    }

    for (const theme of themes) {
      let subthemes2 = await queryForDocuments(collection(this.db, `/lection/${theme.unique_id}/subtheme`));
      subthemes2.forEach(subtheme => subthemes.push(subtheme));
    }

    if(this.classFilter.length > 0){
      subthemes = subthemes.filter(item => this.classFilter.includes(item.class));
    }

    subthemes.sort((a, b) => a.title.localeCompare(b.title));
    
    document.body.style.cursor = "default";

    return subthemes;
  }
  
  async filterThemes() {
    let result;
    if (this.subjectFilter.length > 0 || this.classFilter.length > 0) {
      result = await Swal.fire({
        title: 'Želite li uključiti prethodno odabrane filtere u pretragu?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Da, želim!',
        cancelButtonText: 'Ne, ne želim!'
      });
      
    }
    
    document.body.style.cursor = "wait";
    
    this.searchTerm = this.searchTerm.trim();
    this.selectedTheme = "0";
    this.selectedSubtheme = "0";
    this.showTasks = false;

    if (result){
      if (result.isConfirmed) {
        await this.resetThemesSubthemes(false);
        await this.resetSubthemes(false);
      } 
      else {
        this.themes = await queryForDocuments(collection(this.db, '/lection')).then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
        this.subthemes = await this.getAllSubthemes();
        
        if (this.subjectFilter.length > 0) {
          this.subjectFilter.forEach(element => {
          document.getElementById(element)['checked'] = false;
        });
        this.subjectFilter = [];
        }
        if (this.classFilter.length > 0) {
          this.classFilter.forEach(element => {
            document.getElementById(`${element}`)['checked'] = false;
          });
          this.classFilter = [];
        }
      }
    }
    else {
      this.themes = await queryForDocuments(collection(this.db, '/lection')).then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
      this.subthemes = await this.getAllSubthemes();
    }

    if (this.searchTerm !== '') {
      this.themes = this.themes.filter(item => item.theme.toLowerCase().includes(this.searchTerm.toLowerCase()));
      this.subthemes = this.subthemes.filter(item => item.title.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }

    document.body.style.cursor = "default";
  }

  //nova lekcija
  addLection(content: string) {
    this.designer.changeContent(content);
    this.actionService.action = 'lection';
  }

  //odabir teme
  async onThemeSelected(change: boolean) {
    const docRef = doc(this.db, "lection", this.selectedTheme);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      this.selectedSubject = docSnap.data()['subject'];
    }
    
    if (change) {
      this.selectedSubtheme = "0"
      this.showTasks = false;
      this.tasks = null;
      await this.getSubthemeByTheme();
    }
    else {
      let selectedSubthemeTemporary = this.selectedSubtheme;
      this.selectedSubtheme = "0";
      await this.getSubthemeByTheme();
      this.selectedSubtheme = selectedSubthemeTemporary;
    }
  }

  //filter po predmetima
  subjectFilter: string[] = [];

  onSubjectFilterChange(event) {
    if (event.target.checked) {
      this.subjectFilter.push(event.target.id);
    } else {
      this.subjectFilter = this.subjectFilter.filter(item => item !== event.target.id);
    }
    this.resetThemesSubthemes(true);
  }

  async resetThemesSubthemes(blank: boolean) {
    if(this.subjectFilter.length > 0){
      this.themes = await queryForDocuments(collection(this.db, '/lection'))
      .then(res => res.filter(item => this.subjectFilter.includes(item.subject)))
      .then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
    }
    else {
      this.themes = await queryForDocuments(collection(this.db, '/lection'))
      .then(res => res.sort((a, b) => a.theme.localeCompare(b.theme)));
    }
    
    if(blank) {
      this.searchTerm = '';
    }

    this.selectedTheme = "0";
    this.selectedSubtheme = "0";
    this.showTasks = false;
    this.subthemes = await this.getAllSubthemes();
  }

  //filter po razredima
  classFilter: number[] = [];

  onClassFilterChange(event){
    if (event.target.checked) {
      this.classFilter.push(Number(event.target.id));
    } else {
      this.classFilter = this.classFilter.filter(item => item !== Number(event.target.id));
    }
    this.resetSubthemes(true);
  }

  async resetSubthemes(blank: boolean) {
    if(this.classFilter.length > 0){
      if(this.selectedTheme !== "0"){
        await this.getSubthemeByTheme();
      }
      else {
        this.subthemes = await this.getAllSubthemes();
      }
    }
    else {
      if(this.selectedTheme !== "0"){
        await this.getSubthemeByTheme();
      }
      else {
        this.subthemes = await this.getAllSubthemes();
      }
    }

    if(blank){
      this.searchTerm = '';
    }
    this.selectedSubtheme = "0";
    this.showTasks = false;
  }

  //dohvaćanje podtema za odabranu temu
  async getSubthemeByTheme() {
    document.body.style.cursor = "wait";

    this.path = `/lection/${this.selectedTheme}/subtheme`;
    this.subthemes = await queryForDocuments(collection(this.db, this.path));
    if(this.classFilter.length > 0){
      this.subthemes = this.subthemes.filter(item => this.classFilter.includes(item.class));
    }
    this.subthemes = this.subthemes.sort((a, b) => a.title.localeCompare(b.title));
    
    document.body.style.cursor = "default";
  }

  //odabir podteme
  async onPodtemaSelected() {
    //ako nije odabrana tema, nego prvo podtema
    if(this.selectedTheme === "0" && this.selectedSubtheme !== "0"){
      this.themes = await queryForDocuments(collection(this.db, '/lection'));

      for (const theme of this.themes) {
        let subthemes2 = await queryForDocuments(collection(this.db, `/lection/${theme.unique_id}/subtheme`));
        for (let i = 0; i < subthemes2.length; i++) {
          const subtheme = subthemes2[i];
          if (subtheme.unique_id === this.selectedSubtheme) {
            this.selectedTheme = theme.unique_id;
            break;
          }
        }
      }
      await this.onThemeSelected(false);
      if (this.subjectFilter.length > 0) {
        this.subjectFilter.forEach(element => {
          document.getElementById(element)['checked'] = false;
        });
        this.subjectFilter = [];
      }
      if (this.classFilter.length > 0) {
        this.classFilter.forEach(element => {
          document.getElementById(`${element}`)['checked'] = false;
        });
        this.classFilter = [];
      }
    }
    
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
        if (this.selectedType === "image"){
          const storage = getStorage();
          const imageRef = ref(storage, a.text);
          deleteObject(imageRef);
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
      this.themes = await queryForDocuments(collection(this.db, '/lection')).then(res => res);
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

  showSubtheme() {        
    Swal.fire({
      title: 'Za koliko učenika želite prikazati podtemu?',
      input: 'select',
      inputOptions: {
        '2': '2',
        '3': '3',
        '4': '4'
      },
      inputPlaceholder: 'Odaberite broj',
      inputAttributes: {
        style: 'color: #212529; font-size: 1rem; font-weight: 400; line-height: 1.5; border: 1px solid #ced4da; border-radius: 0.375rem;'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.openDialogSubtheme(result.value);
      }
    });
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
        theme: this.selectedTheme,
        type: this.selectedType
      }
    });
  }

  //pop up prozor za prikaz podteme
  openDialogSubtheme(studentNumber): void {
    const selectTheme = document.getElementById("theme");
    const selectedTheme = (<HTMLSelectElement>selectTheme).options[(<HTMLSelectElement>selectTheme).selectedIndex].innerText;

    const selectSubtheme = document.getElementById("subtheme2");
    const selectedSubtheme = (<HTMLSelectElement>selectSubtheme).options[(<HTMLSelectElement>selectSubtheme).selectedIndex].innerText;

    const tasksDiv = document.querySelector("#tasks");
    const links = tasksDiv.querySelectorAll("a");
    const tasks = [];

    links.forEach(link => {
      const str = link.text;
      const index = str.indexOf("Pregled zadatka");
      const result = str.substring(0, index);

      tasks.push(result);
    });
    
    const dialogRef = this.dialog.open(PodtemaComponent, {
      width: '60em',
      data: {
        studentNumber: studentNumber,
        subtheme: selectedSubtheme,
        subthemeId: this.selectedSubtheme,
        theme: selectedTheme,
        themeId: this.selectedTheme,
        type: this.selectedType,
        tasks: tasks
      }
    });
  }
}