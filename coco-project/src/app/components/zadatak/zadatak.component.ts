import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from '../../services/firebase-service.service';
import { getDocs, collection } from "firebase/firestore";
import { getStorage, getDownloadURL, ref } from 'firebase/storage';
import { MatDialogRef } from '@angular/material/dialog';

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
  selector: 'app-zadatak',
  templateUrl: './zadatak.component.html',
  styleUrls: ['./zadatak.component.css']
})

export class ZadatakComponent {
  constructor(private firebaseSevice: FirebaseService, @Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ZadatakComponent>) { 
    this.getAnswers();
  }

  db = this.firebaseSevice.getDb();

  path;
  tasks;
  correctAnswers = [];
  allAnswers = [];
  result: string;
  allAnswersLoaded = false;

  async getAnswers() {
    this.allAnswersLoaded = false;
    //prvo dolazimo do svih zadataka iz podteme
    this.path = `/lection/${this.data.theme}/subtheme/${this.data.subtheme}/task`;
    const tasks = await queryForDocuments(collection(this.db, this.path));
    this.tasks = tasks;

    await this.waitUntilDataLoaded();

    this.allAnswers.sort(() => Math.random() - 0.5);
  }

  //dodatna funkcija kako bi se prvo pričekali svi odgovori i tek bi se onda prikazali 
  async waitUntilDataLoaded() {
    for (const task of this.tasks) {
      let answers = await queryForDocuments(collection(this.db, this.path + `/${task.unique_id}/answer`));
      for (const answer of answers) {
        //ako su odgovori tekstualni
        if(this.data.type === "text"){
          this.allAnswers.push({name: answer.text, marked: false});
          if (task.unique_id === this.data.task.unique_id){
            this.correctAnswers.push(answer.text);
          }
        }
        //ako su odgovori slike
        else if (this.data.type === "image"){
          const storage = getStorage();
          const slikaRef = answer.text;
          const url = await getDownloadURL(ref(storage, slikaRef));
          this.allAnswers.push({ url: url, marked: false });
          if (task.unique_id === this.data.task.unique_id){
            this.correctAnswers.push(url);
          }
        }
      }
    }
    this.allAnswersLoaded = true;
  }

  chechkAnswers() {
    const markedAnswers = this.allAnswers.filter(answer => answer.marked).map(answer => {
      if (answer.name){
        return answer.name;
      }
      else if (answer.url) {
        return answer.url;
      }
    });
    const correctAnswers = markedAnswers.every(answer => this.correctAnswers.includes(answer)) && (markedAnswers.length == this.correctAnswers.length);
    this.result = correctAnswers ? "Točno!" : "Netočno!";
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}