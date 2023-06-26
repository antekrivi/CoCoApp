import { Component, OnInit, ViewChild } from '@angular/core';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, or, query, where } from 'firebase/firestore';
import * as Highcharts from 'highcharts';
import { format } from 'date-fns';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  
@ViewChild('myChart') componentRef;
colors = ['#751428', '#00CED1', '#8A2BE2', '#ADFF2F', '#FF1493', '#FF1493', '#9370DB', '#2b908f', '#f45b5b', '#91e8e1']; // Array of colors for different groups
unsubscribeFromFirestore: () => void; // add this to your component's member variables

chartRef;
updateFlag;
Highcharts: typeof Highcharts = Highcharts;
chartOptions: Highcharts.Options = {
  chart: {
      height: 500, // height in pixels
      //width: 2000
  },
    title: {
        text: 'Statistika'
    },
    tooltip: {
      shared: true,
  },
    xAxis: {
    },
    series: []
};
documentIds: any[]; // add your document ids here
data: any;
selectedId: string = null;
IRTflag: boolean = false;
displayData: string = 'accuracy';
dropdownItems: { id: string, displayText: string, topic: string, subtopic: string, date: Date }[] = [];

  // ...
  selectedGroup: string = 'all'; // new variable for the selected group
  groupOptions: string[] = []; // new variable for the group options
  // ...
constructor() {
}

selectGroup(group: string) {
  this.selectedGroup = group;
  this.updateChart();
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

  // Here is where unsubscribeFromFirestore is assigned.
  // It gets the return value of the onSnapshot function.
  this.unsubscribeFromFirestore = onSnapshot(analyticsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New data: ', change.doc.data());
        // Your code to handle the new data
        this.fetchDropdownItems().then(() => this.getData());
      }
      if (change.type === 'modified') {
        console.log('Modified data: ', change.doc.data());
        // Your code to handle the modified data
        this.fetchDropdownItems().then(() => this.getData());
      }
      if (change.type === 'removed') {
        console.log('Removed data: ', change.doc.data());
        // Your code to handle the removed data
        this.fetchDropdownItems().then(() => this.getData());
      }
    });
  });
}





async fetchDropdownItems() {
  
  while(this.dropdownItems.length > 0){
    this.dropdownItems.pop();
  }
  
  const db = getFirestore();
  const querySnapshot = await getDocs(collection(db, 'Analytics'));

  // Use a JavaScript Set to keep track of unique combinations
  const uniqueCombinations = new Set<string>();

  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    const dateObject = data['date'].toDate();
    const formattedDate = format(dateObject, 'dd/MM/yyyy');

    // Create a string that combines the three fields
    const combinedString = `${data['topic']} - ${data['subtopic']}- ${formattedDate}`;

   if (!this.dropdownItems.flatMap(v => v.id).includes(data['activityId'])) {
      //If this combination hasn't been seen before, add it to the Set
      uniqueCombinations.add(combinedString);

      // Also add it to the dropdown items, along with the Topic, Subtopic, and Date values
      this.dropdownItems.push({
        id: data['activityId'],
        displayText: combinedString,
        topic: data['topic'],
        subtopic: data['subtopic'],
        date: dateObject
      });
   }});
   console.log(this.dropdownItems);
}

async getData() {
  const db = getFirestore();
  
  // Find the dropdown item with the selected id
  const selectedItem = this.dropdownItems.find(item => item.id === this.selectedId);

  if (!selectedItem) {
    console.log('No such document!');
    return;
  }

  // Create a compound query that matches the Topic, Subtopic, and Date
  const compoundQuery = query(
    collection(db, 'Analytics'),
    where('activityId', '==', selectedItem.id)
  );

  // Fetch all documents that match the query
  const querySnapshot = await getDocs(compoundQuery);

  console.log(querySnapshot);

  let data = querySnapshot.docs.map(doc => doc.data());
  console.log('analitic data');
  console.log(data);

  // Extract the unique group identifiers from the fetched data
  this.groupOptions = ['all', ...Array.from(new Set(data.map(item => item['group']))).sort((a, b) => a - b)];
  if(this.groupOptions.length > 2){
    
    this.selectedGroup = 'all';
  }else{
    this.groupOptions = [];
    this.selectedGroup = '1';
  }

  // Filter the data based on the selected group
  let filteredData;
  filteredData = data;
  // if (this.selectedGroup === 'all') {
 
  // } else {
  //   filteredData = data.filter(item => item['Group'] === this.selectedGroup);
  // }

  
  console.log(this.data);
  this.data = filteredData;
  this.updateChart();
}


updateChartData(): void {
  this.chartRef.series[0].update({
    type: 'column'
  });
}

chartCallback: Highcharts.ChartCallbackFunction = chart => {
  this.chartRef = chart;
};

a
removeSeries() {
  while(this.chartRef.series.length != 0){
    this.chartRef.series[0].destroy();
  }
}
updateChart(button?) {
  this.removeSeries()
    if(button != null){
    if (button === 1) {
      this.displayData = 'accuracy';
    } else if (button === 2) {
      this.displayData = 'resolutionTime';
    } else if (button === 3) {
      this.displayData = 'discussionTime';
    }
}

  // Handle 'all' option
  if (this.selectedGroup === 'all') {
    for (let groupIndex in this.data) {
      let groupData = this.data[groupIndex].results;

      if(this.displayData == 'discussionTime'){
        this.createSeries(this.data[groupIndex], Number(groupIndex));
      } else{
        for (let element of groupData) {
          this.createSeries(element, Number(groupIndex));
        }
      }
    }
  } else {
    console.log(this.data.filter(item => item['group'] === Number(this.selectedGroup))[0]);
    let filteredData = this.data.filter(item => item['group'] === Number(this.selectedGroup))[0];
    
    if(this.displayData == 'discussionTime'){
      this.chartRef.addSeries({
        name: 'Grupa ' + filteredData.group,
        data: filteredData['discussionTimes'],
        type: 'line',
        //color: this.selectedGroup === 'all' ? this.colors[groupIndex]: undefined 
      });
    }else{
      for(let element in filteredData.results){
      this.createSeries(filteredData.results[element]);
      }
    }
  }

  // update x-axis categories
  // this.chartOptions.xAxis = {
  //   categories: Array.from({length: this.count}, (_, i) => `Repetition ${i+1}`)
  // };
    
  
  // this.chartRef.update({
  //   tooltip: {
  //     formatter: function() {
  //       // Display origData directly in the tooltip
  //       return `${this.series.name}: ${this.point.options.origData}`;
  //     }
  //   }
  // });
  
  
  // this.chartRef.update(this.chartOptions);
}

createSeries(element, groupIndex?) {
  let count = Object.keys(element).filter(key => key.includes(this.displayData)).length;
  let listdata = [];

  for(let i = 0; i < count; i++) {
    if (Array.isArray(element[this.displayData + i])) {
      // Sum up the values in the array using the reduce() method
      let sum = element[this.displayData + i].reduce((total, value) => total + value, 0);
      listdata.push(sum);
    } else {
      listdata.push(element[this.displayData + i]);
    }
  }
if(this.displayData == 'discussionTime'){
  this.chartRef.addSeries({
    name: 'Grupa ' + (groupIndex+1),
    data: element['discussionTimes'],
    type: 'line',
    color: this.selectedGroup === 'all' ? this.colors[groupIndex]: undefined 
  });
}else{
  
  this.chartRef.addSeries({
    name: element.name,
    data: listdata.map((value) => ({
      y: value,
    })),
    type: 'line',
    color: this.selectedGroup === 'all' ? this.colors[groupIndex]: undefined 
  });
  
}
}


}
