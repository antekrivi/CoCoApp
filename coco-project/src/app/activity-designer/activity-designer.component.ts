import { Component, OnInit } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, DocumentReference, getDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../services/firebase-service.service';
import { RadnjaService } from '../services/radnja.service';
import { ActivityDTO } from '../aktivnosti-dto';
import { DEFAULT_DIALOG_CONFIG } from '@angular/cdk/dialog';


//funkcija za čitanje više dokumenata
async function queryForDocuments(new_query) {
  const querySnapshot = await getDocs(new_query);
  let rezultat = [];
  const allDocs = querySnapshot.forEach((snap) => {
    let noviObjekt = Object.assign({}, snap.data(), { ID: snap.id });
    rezultat.push(noviObjekt); 
  });
  return rezultat;
}

@Component({ 
  selector: 'app-activity-designer',
  templateUrl: './activity-designer.component.html',
  styleUrls: ['./activity-designer.component.css']
})
export class ActivityDesignerComponent implements OnInit  {
  db = this.firebaseService.getDb();
  constructor(private firebaseService :FirebaseService, private dizajner: DizajnerPocetnoComponent, private radnjaService: RadnjaService) {
    this.load();
  }
  numberOfTablets: number | null = null;
  numberOfChildren: number | null = null;
  groupings: number[][] = [];
  selectedGrouping: string | null = null;

  ngOnInit() {
    this.updateTimesDiscussionAndCorrection();
  }
  
  updateTimesDiscussionAndCorrection() {
    const newLength = this.numberOfRepetitions;
  
    this.times.discussion = [ ...this.times.discussion, ...Array(newLength - this.times.discussion.length).fill(null)];

    this.times.correction = [ ...this.times.correction, ...Array(newLength - this.times.correction.length).fill(null)];
    // // Update discussion array
    // this.times.discussion = Array(newLength).fill(1);
  
    // // Update correction array
    // this.times.correction = Array(newLength).fill(1);
  }
  
  
  
  
// Update the times object inside your component class
times: any = {
  solving: null,
  discussion: Array(5).fill(1),
  correction: Array(5).fill(1),
};



// Update any related functions that deal with times.discussion and times.correction

  
  lessons$ = queryForDocuments(collection(this.db, "lection")).then(res => res);
  activity$ = queryForDocuments(collection(this.db, "ActiveActivity")).then(res => res)
  subtopics$ : any
  selectedTopic: string = "";
  selectedSubtopic: string = "";
  activity: ActivityDTO;
  


  
// Add these properties to the class
invalidFields: { [key: string]: boolean } = {
  selectedTopic: false,
  selectedSubtopic: false,
  solving: false,
  discussion: false,
  correction: false,
  numberOfTablets: false,
  numberOfChildren: false,
};

shakeFields: { [key: string]: boolean } = {
  selectedTopic: false,
  selectedSubtopic: false,
  solving: false,
  discussion: false,
  correction: false,
  numberOfTablets: false,
  numberOfChildren: false,
};

  
outcome: 'success' | 'error' | null = null;
buttonText = 'Spremi';
message: string | null = null;

resetButton() {
  this.buttonText = 'Spremi';
  this.outcome = null;
  this.message = null;
}

handleClick() {
  this.buttonText = 'Processing...';
  this.outcome = null;
  this.message = null;

  // Replace this with your actual function that determines the outcome
  setTimeout(async () => {
    const isSuccess = await this.save() == 0;
    this.outcome = isSuccess ? 'success' : 'error';
    this.buttonText = isSuccess ? 'Uspjeh: ' : 'Greška: ';
    this.message = isSuccess ? 'Podaci uspješno spremljeni.' : 'Forma nije ispunjena.';
    setTimeout(() => {
      this.resetButton();
    }, 4000);
  }, 1000);
}

  

  async load(){  

  this.activity = (await this.activity$).at(0);
    if((await this.activity$).length  > 0){
      
      this.selectedTopic = this.activity.lessonRef;
      this.times.solving = this.activity.solvingTime;
      this.times.discussion = this.activity.discussionTimes;
      this.times.correction = this.activity.correctionTimes;
      this.numberOfChildren = this.activity.numOfStudents.reduce((acc, cur) => acc + cur, 0);
      this.numberOfTablets = this.activity.numOfStudents.length;
      this.updateGroupings();
      this.selectedGrouping = this.activity.numOfStudents.toString();
      this.updateSubtopics();
      this.selectedSubtopic = this.activity.subTopicRef;
    }
  }

  private _numberOfRepetitions = 1;

get numberOfRepetitions(): number {
  return this._numberOfRepetitions;
}

set numberOfRepetitions(value: number) {
  this._numberOfRepetitions = value;
  this.updateDiscussionAndCorrectionArrays();
}

updateDiscussionAndCorrectionArrays(): void {
  // Update the discussion array
  if (this.times.discussion.length < this._numberOfRepetitions) {
    const diff = this._numberOfRepetitions - this.times.discussion.length;
    for (let i = 0; i < diff; i++) {
      this.times.discussion.push(null);
    }
  } else if (this.times.discussion.length > this._numberOfRepetitions) {
    this.times.discussion.splice(this._numberOfRepetitions);
  }

  // Update the correction array
  if (this.times.correction.length < this._numberOfRepetitions) {
    const diff = this._numberOfRepetitions - this.times.correction.length;
    for (let i = 0; i < diff; i++) {
      this.times.correction.push(null);
    }
  } else if (this.times.correction.length > this._numberOfRepetitions) {
    this.times.correction.splice(this._numberOfRepetitions);
  }
}



  
  
  public async save() {
    // Validate the form before saving
    if (!this.validateForm()) {
      return 1;
    }

    const tempAnswers = {};
    const questionArray: string[] = [];
    let DTO : ActivityDTO = new ActivityDTO();
    DTO.subTopic = (await getDoc(doc(this.db, `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}`))).get('title');
    DTO.topic = (await getDoc(doc(this.db, `/lection/${this.selectedTopic}`))).get('theme');
    DTO.subTopicRef = this.selectedSubtopic;
    DTO.lessonRef = this.selectedTopic;
    DTO.numOfStudents = this.selectedGrouping.split(',').map(Number);
    DTO.configToTablet = Array(this.selectedGrouping.split(',').map(Number).length).fill(null);


    DTO.solvingTime = this.times.solving;
    DTO.discussionTimes = this.times.discussion;
    DTO.correctionTimes = this.times.correction;


    const questions = await queryForDocuments(collection(this.db, `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}/task`));

    for (const question of questions) {
      questionArray.push(question.textTask);
      const answers = await queryForDocuments(collection(this.db, `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}/task/${question.ID}/answer`));
      for (const answer of answers) {
        tempAnswers[answer.text] = questionArray.length - 1;
      }
    }
    DTO.answers = tempAnswers;
    DTO.questions = questionArray;
    
    try {
      if(this.activity != null){
        this.update(DTO);
      }else{
      this.insert(DTO);
      }
      return 0;
    } catch (error) {
      return 1;
    }

}


  public async insert(DTO : ActivityDTO){
      const result = await addDoc(collection(this.db, "ActiveActivity"), {
        solvingTime:DTO.solvingTime,
        discussionTimes:DTO.discussionTimes,
        correctionTimes:DTO.correctionTimes,
        answers: DTO.answers,
        configToTablet: DTO.configToTablet,
        lessonRef:DTO.lessonRef,
        numOfStudents: DTO.numOfStudents,
        questions: DTO.questions,
        subTopic:DTO.subTopic,
        subTopicRef:DTO.subTopicRef,
        topic:DTO.topic
      });
      console.log(result.id)
      this.activity = new ActivityDTO();
      this.activity.ID = result.id

  }
  
  public async update(DTO : ActivityDTO){
    const docRef = doc(this.db, `/ActiveActivity/${this.activity.ID}`)
      await updateDoc(docRef, {
        solvingTime:DTO.solvingTime,
        discussionTimes:DTO.discussionTimes,
        correctionTimes:DTO.correctionTimes,
        answers: DTO.answers,
        configToTablet: DTO.configToTablet,
        lessonRef:DTO.lessonRef,
        numOfStudents: DTO.numOfStudents,
        questions: DTO.questions,
        subTopic:DTO.subTopic,
        subTopicRef:DTO.subTopicRef,
        topic:DTO.topic
      });
  }

  public async delete(ActivRef :DocumentReference){
      await deleteDoc(ActivRef);
  }


  updateSubtopics(): void{
    this.subtopics$ = queryForDocuments(collection(this.db, `/lection/${this.selectedTopic}/subtheme`));
  }

  updateGroupings(): void {
    if (this.numberOfTablets && this.numberOfChildren) {
      this.generateGroupings();
    } else {
      this.groupings = [];
    }
    this.shakeFields['selectedGrouping'] = false;
    this.invalidFields['selectedGrouping'] = false;
  }

  generateGroupings() {
    if (this.numberOfTablets * 2 > this.numberOfChildren || this.numberOfChildren / this.numberOfTablets > 4) {
      this.groupings = [];
      return;
    }

    const results = new Set<string>();

    const helper = (tabletGroup: number[], remainingChildren: number) => {
      if (tabletGroup.length === this.numberOfTablets) {
        if (remainingChildren === 0) {
          const sortedGroup = tabletGroup.slice().sort((a, b) => a - b).toString();
          results.add(sortedGroup);
        }
        return;
      }

      for (let i = 2; i <= 4; i++) {
        if (remainingChildren >= i) {
          tabletGroup.push(i);
          helper(tabletGroup, remainingChildren - i);
          tabletGroup.pop();
        }
      }
    };

    helper([], this.numberOfChildren);

    this.groupings = Array.from(results).map((grouping) => grouping.split(',').map(Number));
    this.selectedGrouping = null;
  }

validateField(fieldName: string, value: any) {
  this.invalidFields[fieldName] = !value;
}

validateForm(): boolean {
  const fields = [
    { fieldName: 'selectedTopic', value: this.selectedTopic },
    { fieldName: 'selectedSubtopic', value: this.selectedSubtopic },
    { fieldName: 'numberOfTablets', value: this.numberOfTablets },
    { fieldName: 'numberOfChildren', value: this.numberOfChildren },
    { fieldName: 'selectedGrouping', value: this.selectedGrouping },
    { fieldName: 'correction', value: this.times.correction },
    { fieldName: 'discussion', value: this.times.discussion },
    { fieldName: 'solving', value: this.times.solving },
  ];


  let valid = true;

  fields.forEach((field) => {
    if (field.value == null || field.value == "") {
      this.invalidFields[field.fieldName] = true;
      this.shakeFields[field.fieldName] = true;
      valid = false;
    } else {
      this.invalidFields[field.fieldName] = false;
      this.shakeFields[field.fieldName] = false;
    }
      this.resetShakeClass(field.fieldName);
  });

  return valid;
}

resetShakeClass(fieldName: string) {
  if(this.shakeFields[fieldName] == true){
    setTimeout(() => {
      this.shakeFields[fieldName] = false;
    }, 700);
  }
}

}
