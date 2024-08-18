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
  groupColumns: string[] = ["header-row-empty"];
  iterationColumns: string[] = [];
  displayedColumns: string[] = ['group-id', 'name'];
  resultColumns: string[] = [];
  dropdownItems: {
    id: string;
    displayText: string;
    topic: string;
    subtopic: string;
    date: Date;
  }[] = [];

  constructor() {}

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

    this.resetColumns();
    this.addColumns(data);
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

  addColumns(data) {
    for (let i = 0; i < data[0].resolutionTimesMax.length; i++) {
      this.displayedColumns.push('T' + i, 'N' + i);
      this.resultColumns.push('T' + i, 'N' + i);
      this.iterationColumns.push(String(i+1));
    }
    this.groupColumns.push(...this.iterationColumns)
  }

  resetColumns() {
    this.displayedColumns = ['group-id', 'name'];
    this.resultColumns = [];
    this.groupColumns = ["header-row-empty"];
    this.iterationColumns = [];
  }
}
