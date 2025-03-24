import { Component, OnInit } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  updateDoc,
} from 'firebase/firestore';
import { DizajnerPocetnoComponent } from '../dizajner-pocetno/dizajner-pocetno.component';
import { FirebaseService } from '../../services/firebase-service.service';
import { RadnjaService } from '../../services/radnja.service';
import { ActivityDTO } from '../../aktivnosti-dto';
import Swal from 'sweetalert2';

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
  styleUrls: ['./activity-designer.component.css'],
})
export class ActivityDesignerComponent implements OnInit {
  db = this.firebaseService.getDb();
  clearselectedGrouping = true;
  timeOptions: any[];
  constructor(
    private firebaseService: FirebaseService,
    private dizajner: DizajnerPocetnoComponent,
    private radnjaService: RadnjaService
  ) {
    this.load();
  }
  numberOfTablets: number | null = null;
  numberOfChildren: number | null = null;
  groupings: number[][] = [];
  selectedGrouping: string | null = null;


//sandbox
rawTimeValue: string = '';

get formattedTime(): string {
  let val = this.rawTimeValue.replace(/[^0-9]/g, '');

  if (val.length === 0) return '--:--';
  if (val.length === 1) return val + '-:--';
  if (val.length === 2) return val + ':--';
  if (val.length === 3) return val.substring(0, 2) + ':' + val.charAt(2) + '-';
  if (val.length === 4) return val.substring(0, 2) + ':' + val.substring(2);

  return '--:--';  // default
}

onTimeInput(event: any): void {
  let val = event.target.value.replace(/[^0-9]/g, '');
  if (val.length > 4) {
    val = val.substring(0, 4);
  }
  this.rawTimeValue = val;
}
//sendbox


  ngOnInit() {
    this.updateTimesDiscussionAndCorrection();
  }

  updateTimesDiscussionAndCorrection() {
    if (this.numberOfRepetitions < 1) {
      const newLength = this.numberOfRepetitions;
      if (this.times.discussion != null)
        this.times.discussion = [
          ...this.times.discussion,
          ...Array(newLength - this.times.discussion.length).fill(null),
        ];

      if (this.times.correction != null)
        this.times.correction = [
          ...this.times.correction,
          ...Array(newLength - this.times.correction.length).fill(null),
        ];
    }
  }

  generateTimeOptions() {
    const options = [];
    for(let i = 60; i <= 2700; i += 30) { // Loop from 60 to 2700 (45 minutes in seconds) with steps of 30 seconds
      options.push({
        value: i,
        display: `${Math.floor(i / 60).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}`
      });
    }
    options.sort((a,b) => 0 - (a.value > b.value ? 1 : -1));
    return options;
  }

  // Update the times object inside your component class
  times: any = {
    solving: '--:--',
    discussion: [],
    correction: [],
  };

  // Update any related functions that deal with times.discussion and times.correction

  lessons$ = queryForDocuments(collection(this.db, 'lection')).then(
    (res) => res
  );
  activity$ = queryForDocuments(collection(this.db, 'ActiveActivity')).then(
    (res) => res
  );
  subtopics$: any;
  selectedTopic: string = '';
  selectedSubtopic: string = '';
  activity: ActivityDTO;
  selectedSubtopicAnwserType: boolean;

  // Add these properties to the class
  invalidFields: { [key: string]: boolean } = {
    selectedTopic: false,
    selectedSubtopic: false,
    solving: false,
    discussion0: false,
    correction0: false,
    numberOfTablets: false,
    numberOfChildren: false,
    repetition: false,
  };

  shakeFields: { [key: string]: boolean } = {
    selectedTopic: false,
    selectedSubtopic: false,
    solving: false,
    discussion0: false,
    correction0: false,
    numberOfTablets: false,
    numberOfChildren: false,
    repetition: false,
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


    this.buttonText = 'Procesiranje';
    this.outcome = null;
    this.message = null;

    this.save();

  }

  async load() {

    this.timeOptions = this.generateTimeOptions();

    this.activity = (await this.activity$).at(0);
    if ((await this.activity$).length > 0) {
      this.selectedTopic = this.activity.lessonRef;
      this._numberOfRepetitions = this.activity.correctionTimes.length;
      this.times.solving = this.formatSecondsToMinutes(this.activity.solvingTime)
      this.times.discussion = this.activity.discussionTimes.map(this.formatSecondsToMinutes)
      this.times.correction = this.activity.correctionTimes.map(this.formatSecondsToMinutes)
      this.numberOfChildren = this.activity.numOfStudents.reduce(
        (acc, cur) => acc + cur,
        0
      );
      this.numberOfTablets = this.activity.numOfStudents.length;
      this.updateGroupings();
      this.selectedGrouping = this.activity.numOfStudents.toString();
      this.updateSubtopics();
      this.selectedSubtopic = this.activity.subTopicRef;
      this.setSubtopic();
    }
  }

  private _numberOfRepetitions = 1;
  sortBalance = true;

  get numberOfRepetitions(): number {
    return this._numberOfRepetitions;
  }

  set numberOfRepetitions(value: number) {
    this._numberOfRepetitions = value;
    this.updateDiscussionAndCorrectionArrays();
  }


  formatSecondsToMinutes(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

  updateDiscussionAndCorrectionArrays(): void {
    // Update the discussion array
    if (this.times.discussion.length < this._numberOfRepetitions) {
      const diff = this._numberOfRepetitions - this.times.discussion.length;
      for (let i = 0; i < diff; i++) {
        this.times.discussion.push('--:--');
        this.invalidFields[`discussion${i}`] = false;
        this.shakeFields[`discussion${i}`] = false;
      }
    } else if (this.times.discussion.length > this._numberOfRepetitions) {
      this.times.discussion.splice(this._numberOfRepetitions);
      for (
        let i = this.times.discussion.length;
        i > this._numberOfRepetitions;
        i--
      ) {
        delete this.invalidFields[`discussion${i}`];
        delete this.shakeFields[`discussion${i}`];
      }
    }

    // Update the correction array
    if (this.times.correction.length < this._numberOfRepetitions) {
      const diff = this._numberOfRepetitions - this.times.correction.length;
      for (let i = 0; i < diff; i++) {
        this.times.correction.push('--:--');
        this.invalidFields[`correction${i}`] = false;
        this.shakeFields[`correction${i}`] = false;
      }
    } else if (this.times.correction.length > this._numberOfRepetitions) {
      this.times.correction.splice(this._numberOfRepetitions);
      for (
        let i = this.times.correction.length;
        i > this._numberOfRepetitions;
        i--
      ) {
        delete this.invalidFields[`correction${i}`];
        delete this.shakeFields[`correction${i}`];
      }
    }
  }

  convertToSeconds(timeString: string): number {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}


  public async save() {
    // Validate the form before saving
    if (!this.validateForm()) {
      return 1;
    }

    const tempAnswers = {};
    const questionArray: string[] = [];
    let DTO: ActivityDTO = new ActivityDTO();
    DTO.subTopic = (
      await getDoc(
        doc(
          this.db,
          `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}`
        )
      )
    ).get('title');
    DTO.topic = (
      await getDoc(doc(this.db, `/lection/${this.selectedTopic}`))
    ).get('theme');
    DTO.subTopicRef = this.selectedSubtopic;
    DTO.lessonRef = this.selectedTopic;
    DTO.numOfStudents = this.selectedGrouping.split(',').map(Number);
    DTO.configToTablet = Array(
      this.selectedGrouping.split(',').map(Number).length
    ).fill(null);
    DTO.solvingTime = this.convertToSeconds(this.times.solving);

    DTO.discussionTimes = this.times.discussion.map(this.convertToSeconds);
    DTO.correctionTimes = this.times.correction.map(this.convertToSeconds);
    const questions = await queryForDocuments(
      collection(
        this.db,
        `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}/task`
      )
    );

    for (const question of questions) {
      questionArray.push(question.textTask);
      const answers = await queryForDocuments(
        collection(
          this.db,
          `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}/task/${question.ID}/answer`
        )
      );
      for (const answer of answers) {
        tempAnswers[answer.text] = questionArray.length - 1;
      }
    }
    DTO.answers = tempAnswers;
    DTO.questions = questionArray;

    try {
      if (this.activity != null) {
        this.update(DTO);
      } else {
        this.insert(DTO);
      }
      return 0;
    } catch (error) {
      return 1;
    }
  }

  balancedGroupingsFirst() {
    this.sortBalance = true;
    this.clearselectedGrouping = false;
    this.updateGroupings();
    this.clearselectedGrouping = true;
  }
  unbalancedGroupingsFirst() {
    this.sortBalance = false;
    this.clearselectedGrouping = false;
    this.updateGroupings();
    this.clearselectedGrouping = true;
  }

  unbalancedGroupingsFirstSort(a, b) {
    let countA = a.filter((val) => val === 3).length;
    let countB = b.filter((val) => val === 3).length;
    return countA - countB;
  }

  balancedGroupingsFirstSort(a, b) {
    let countA = a.filter((val) => val === 3).length;
    let countB = b.filter((val) => val === 3).length;
    return countB - countA;
  }

  public async insert(DTO: ActivityDTO) {


    const result = await addDoc(collection(this.db, 'ActiveActivity'), {
      solvingTime: Number(DTO.solvingTime),
      discussionTimes: this.times.discussion.map(this.convertToSeconds),
      correctionTimes: this.times.correction.map(this.convertToSeconds),
      answers: DTO.answers,
      configToTablet: DTO.configToTablet,
      lessonRef: DTO.lessonRef,
      numOfStudents: DTO.numOfStudents,
      questions: DTO.questions,
      subTopic: DTO.subTopic,
      subTopicRef: DTO.subTopicRef,
      topic: DTO.topic,
      anwserTypeImage: this.selectedSubtopicAnwserType,
    });
    this.activity = new ActivityDTO();
    this.activity.ID = result.id;

    Swal.fire({
      icon: 'success',
      title: 'Uspješno ste spremili u bazu!',
      confirmButtonColor: '#3085d6',
      showConfirmButton: true
    });
    setTimeout(() => {
      this.resetButton()
    }, 10)
  }

  public async update(DTO: ActivityDTO) {
    const docRef = doc(this.db, `/ActiveActivity/${this.activity.ID}`);
    await deleteDoc(docRef);
    this.insert(DTO);
  }


  public async delete(ActivRef: DocumentReference) {
    await deleteDoc(ActivRef);
  }

  updateSubtopics(): void {
    this.subtopics$ = queryForDocuments(
      collection(this.db, `/lection/${this.selectedTopic}/subtheme`)
    );
  }
  async setSubtopic(): Promise<void> {
    this.selectedSubtopicAnwserType =
      (
        await getDoc(
          doc(
            this.db,
            `/lection/${this.selectedTopic}/subtheme/${this.selectedSubtopic}`
          )
        )
      ).get('type') === 'image';
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
    if (
      this.numberOfTablets * 2 > this.numberOfChildren ||
      this.numberOfChildren / this.numberOfTablets > 4
    ) {
      this.groupings = [];
      return;
    }

    const results = new Set<string>();

    const helper = (tabletGroup: number[], remainingChildren: number) => {
      if (tabletGroup.length === this.numberOfTablets) {
        if (remainingChildren === 0) {
          const sortedGroup = tabletGroup
            .slice()
            .sort((a, b) => a - b)
            .toString();
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

    this.groupings = Array.from(results).map((grouping) =>
      grouping.split(',').map(Number)
    );
    this.selectedGrouping = this.clearselectedGrouping
      ? null
      : this.selectedGrouping;

    this.groupings.sort(
      this.sortBalance
        ? this.balancedGroupingsFirstSort
        : this.unbalancedGroupingsFirstSort
    );
  }
  validateField(fieldName: string, value: any) {
    this.invalidFields[fieldName] = this.validation(fieldName, value);
  }

  validation(fieldName: string, value: any) {
    if(fieldName .includes('solving') ||
    fieldName.includes('discussion') ||
    fieldName.includes('correction')){
      if (!value) {
        return false;
      }

      const [minutes, seconds] = value.split(':');

      if (!minutes || !seconds) {
        return false;
      }

      const mins = parseInt(minutes, 10);
      const secs = parseInt(seconds, 10);

      return !(mins >= 0 && mins <= 59 && secs >= 0 && secs <= 59);
    }
    if (
      fieldName != 'selectedTopic' &&
      fieldName != 'selectedSubtopic' &&
      fieldName != 'selectedGrouping'
    ) {
        if(fieldName == 'repetition'){
          return isNaN(value) || value < 1;
        }
      return isNaN(value) || !value || value < 0;
    } else {
      return !value;
    }
  }

  validateForm(): boolean {



    const fields = [
      { fieldName: 'selectedTopic', value: this.selectedTopic },
      { fieldName: 'selectedSubtopic', value: this.selectedSubtopic },
      { fieldName: 'numberOfTablets', value: this.numberOfTablets },
      { fieldName: 'numberOfChildren', value: this.numberOfChildren },
      { fieldName: 'selectedGrouping', value: this.selectedGrouping },
      { fieldName: 'solving', value: this.times.solving },
      { fieldName: 'repetition', value: this._numberOfRepetitions },
    ];

    for (let i = 0; i < this._numberOfRepetitions; i++) {
      fields.push({
        fieldName: 'discussion' + i,
        value: this.times.discussion[i],
      });
      fields.push({
        fieldName: 'correction' + i,
        value: this.times.correction[i],
      });
    }

    let valid = true;

    fields.forEach((field) => {
      if (this.validation(field.fieldName, field.value)) {
        this.invalidFields[field.fieldName] = true;
        this.shakeFields[field.fieldName] = true;
        valid = false;
      } else {
        this.invalidFields[field.fieldName] = false;
        this.shakeFields[field.fieldName] = false;
      }
      this.resetShakeClass(field.fieldName);
    });

    if(!valid){
      this.resetButton();
    }
    return valid;
  }

  resetShakeClass(fieldName: string) {
    if (this.shakeFields[fieldName] == true) {
      setTimeout(() => {
        this.shakeFields[fieldName] = false;
      }, 1000);
    }
  }
}
