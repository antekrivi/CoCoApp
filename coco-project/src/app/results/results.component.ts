import { Component, OnInit, ViewChild } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  or,
  query,
  where,
} from 'firebase/firestore';
import { format } from 'date-fns';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css'],
})
export class ResultsComponent implements OnInit {
  @ViewChild('table') componentRef;

  unsubscribeFromFirestore: () => void;

  data: any;
  selectedId: string = null;
  groupColumns: string[];
  iterationColumns: string[] = [];
  displayedColumns: string[] = [];
  resultColumns: string[] = [];
  dropdownItems: {
    id: string;
    displayText: string;
    topic: string;
    subtopic: string;
    date: Date;
  }[] = [];

  selectedOption: string = 'Pregled rezultata';
  options: string[] = ['Pregled rezultata', 'Rang-lista'];

  constructor() {}

  selectOption(option: string) {
    this.selectedOption = option;
    this.getData();
  }

  ngOnInit() {
    this.listenToDataChanges();
    this.fetchDropdownItems().then(() => this.getData());
  }

  ngOnDestroy() {
    if (this.unsubscribeFromFirestore) {
      this.unsubscribeFromFirestore();
    }
  }

  listenToDataChanges() {
    const db = getFirestore();
    const analyticsCollection = collection(db, 'Analytics');

    this.unsubscribeFromFirestore = onSnapshot(
      analyticsCollection,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.fetchDropdownItems().then(() => this.getData());
          }
          if (change.type === 'modified') {
            this.fetchDropdownItems().then(() => this.getData());
          }
          if (change.type === 'removed') {
            this.fetchDropdownItems().then(() => this.getData());
          }
        });
      }
    );
  }

  async fetchDropdownItems() {
    while (this.dropdownItems.length > 0) {
      this.dropdownItems.pop();
    }

    const db = getFirestore();
    const querySnapshot = await getDocs(collection(db, 'Analytics'));

    const uniqueCombinations = new Set<string>();

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const dateObject = data['date'].toDate();
      const formattedDate = format(dateObject, 'dd/MM/yyyy');

      const combinedString = `${data['topic']} - ${data['subtopic']}- ${formattedDate}`;

      if (
        !this.dropdownItems.flatMap((v) => v.id).includes(data['activityId'])
      ) {
        uniqueCombinations.add(combinedString);

        this.dropdownItems.push({
          id: data['activityId'],
          displayText: combinedString,
          topic: data['topic'],
          subtopic: data['subtopic'],
          date: dateObject,
        });
      }
      this.selectedId = this.dropdownItems[0].id;
    });

    this.dropdownItems.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
  }

  async getData() {
    const db = getFirestore();

    const selectedItem = this.dropdownItems.find(
      (item) => item.id === this.selectedId
    );

    if (!selectedItem) {
      return;
    }

    const compoundQuery = query(
      collection(db, 'Analytics'),
      where('activityId', '==', selectedItem.id)
    );
    const querySnapshot = await getDocs(compoundQuery);

    let data = querySnapshot.docs.map((doc) => doc.data());

    if (this.selectedOption === 'Pregled rezultata') this.getResults(data)
    else if (this.selectedOption === 'Rang-lista') this.getRankings(data)

    this.resetColumns();
    this.addColumns(data);
  }

  getResults(data) {
    data.sort((a, b) => {
      if (a['group'] < b['group']) return -1;
      if (a['group'] > b['group']) return 1;
      return 0;
    });

    let tableData = [];
    let groupId = 0;
    for(let entry of data){
      for(let res of entry['results']) {
        tableData.push({
          group: (entry['group'] != groupId) ? entry['group'] : '',
          name: res.name,
          ...this.addResults(entry, res)
        })
        groupId = entry['group'];
      }
    }

    this.data = tableData;
  }

  getRankings(data) {
    let tableData = [];
    for(let entry of data){
      for(let res of entry['results']) {
        tableData.push({
          group: entry['group'],
          name: res.name,
          accuracy: this.addAccuracyOfLastIteration(entry, res)
        })
      }
    }

    tableData.sort((a, b) => {
      if (a['accuracy'] > b['accuracy']) return -1;
      if (a['accuracy'] < b['accuracy']) return 1;
      return 0;
    });

    for (let i = 0; i < tableData.length; i++) {
      tableData[i].rank = tableData[i].accuracy == tableData[i-1]?.accuracy ? tableData[i-1].rank : i+1
    }

    this.data = tableData
  }

  addResults(entry, element) : any[] {
    let repetitions = [];
    for (let i = 0; i < entry.resolutionTimesMax.length; i++) {
      if (element['markedCorrect' + i] !== undefined) {
        repetitions['T' + i] = element['markedCorrect' + i] + "/" + (element['markedCorrect' + i] + element['unmarkedCorrect' + i]);
        repetitions['N' + i] = element['markedIncorrect' + i] || 0;
      }
    }
    return repetitions
  }

  addAccuracyOfLastIteration(entry, element) : number {
    let lastIteration = entry.resolutionTimesMax.length - 1

    let possibleAnswers = entry.numberOfPossibleAnswers
    let markedCorrect = element['markedCorrect' + lastIteration] || 0;
    let unmarkedCorrect = element['unmarkedCorrect' + lastIteration] || 0;
    let markedIncorrect = element['markedIncorrect' + lastIteration] || 0;
    let unmarkedIncorrect = possibleAnswers - markedCorrect - unmarkedCorrect - markedIncorrect || 0;

    let total = possibleAnswers || markedCorrect + unmarkedCorrect + markedIncorrect; //written this way to support legacy analytics data that does not contain numberOfPossibleAnswers
    let accuracy = markedCorrect ? ((markedCorrect + unmarkedIncorrect) / total) * 100 : 0;

    return Number(accuracy.toFixed(2))
  }

  addColumns(data) {
    if (this.selectedOption === 'Pregled rezultata') {
      this.displayedColumns = ['group-id', 'name'];
      for (let i = 0; i < data[0].resolutionTimesMax.length; i++) {
        this.displayedColumns.push('T' + i, 'N' + i);
        this.resultColumns.push('T' + i, 'N' + i);
        this.iterationColumns.push(String(i + 1));
      }
      this.groupColumns.push("header-row-empty", ...this.iterationColumns)
    }
    else if (this.selectedOption === 'Rang-lista') {
        this.displayedColumns = ['rank', 'name', 'group-id', 'accuracy']
      }
  }

  resetColumns() {
    this.displayedColumns = [];
    this.resultColumns = [];
    this.groupColumns = [];
    this.iterationColumns = [];
  }
}
