import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from '../../services/firebase-service.service';
import { getDocs, collection } from "firebase/firestore";
import { getStorage, getDownloadURL, ref } from 'firebase/storage';

async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let result = [];
  for (const snap of querySnapshot.docs) {
    let newObject = Object.assign({}, snap.data(), { unique_id: snap.id });
    result.push(newObject);
  }
  return result;
}

@Component({
  selector: 'app-podtema',
  templateUrl: './podtema.component.html',
  styleUrls: ['./podtema.component.css']
})

export class PodtemaComponent {
  constructor(private firebaseSevice: FirebaseService, @Inject(MAT_DIALOG_DATA) public data: any) { }

  async ngOnInit() {
    await this.getAnswers();

    this.length = this.data.tasks.length;

    if(this.length === 2){
      this.data.tasks.push(this.data.tasks[0])
      this.data.tasks.push(this.data.tasks[1]);
    }
    else if(this.length === 3){
      this.data.tasks.push(this.data.tasks[0]);
    }
  }

  db = this.firebaseSevice.getDb();

  path;
  tasks;
  length;
  allAnswers = [];
  allAnswersLoaded = false;

  async getAnswers() {
    this.allAnswersLoaded = false;
    
    //prvo dolazimo do svih zadataka iz podteme
    this.path = `/lection/${this.data.themeId}/subtheme/${this.data.subthemeId}/task`;
    const tasks = await queryForDocuments(collection(this.db, this.path));
    this.tasks = tasks;

    await this.waitUntilDataLoaded();
  }

  //dodatna funkcija kako bi se prvo pričekali svi odgovori i tek bi se onda prikazali 
  async waitUntilDataLoaded() {
    for (const task of this.tasks) {
      let answers = await queryForDocuments(collection(this.db, this.path + `/${task.unique_id}/answer`));
      for (const answer of answers) {
        //ako su odgovori tekstualni
        if(this.data.type === "text"){
          this.allAnswers.push({text: answer.text});
        }
        //ako su odgovori slike
        else if (this.data.type === "image"){
          const storage = getStorage();
          const slikaRef = answer.text;
          const url = await getDownloadURL(ref(storage, slikaRef));
          this.allAnswers.push({url: url});
        }
      }
    }
    this.allAnswersLoaded = true;
  }

}
