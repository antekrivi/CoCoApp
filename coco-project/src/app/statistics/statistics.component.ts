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
colors = ['#751428', '#00CED1', '#8A2BE2', '#ADFF2F', '#FF1493', '#FF1493', '#9370DB', '#2b908f', '#f45b5b', '#91e8e1'];
unsubscribeFromFirestore: () => void; 

chartRef;
updateFlag;
Highcharts: typeof Highcharts = Highcharts;
chartOptions: 
Highcharts.Options = 
{
  chart: {
      height: 500,
  },
    title: {
        text: ''
    },
    tooltip: {
  },
    xAxis: {
      tickInterval: 1,
    labels: {
      formatter: function() {
        if(typeof this.value == 'number'){
        return this.value + 1 + ''
      }else{
        return this.value
      }
      }
    }
    },
    series: []
};


documentIds: any[]; 
data: any;
selectedId: string = null;
IRTflag: boolean = false;
displayData: string = 'accuracy';
dropdownItems: { id: string, displayText: string, topic: string, subtopic: string, date: Date }[] = [];

  selectedGroup: string = 'sve'; 
  groupOptions: string[] = []; 
constructor() {
}

selectGroup(group: string) {
  this.selectedGroup = group;
  this.updateChart();
}


ngOnInit() {
  this.listenToDataChanges();
  this.fetchDropdownItems().then(() => this.getData());

  
  this.chartRef.xAxis[0].setTitle({
    text: 'Iteracija'
  });

}

ngOnDestroy() {
  if (this.unsubscribeFromFirestore) {
    this.unsubscribeFromFirestore();
  }
}

listenToDataChanges() {
  const db = getFirestore();
  const analyticsCollection = collection(db, 'Analytics');

  this.unsubscribeFromFirestore = onSnapshot(analyticsCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New data: ', change.doc.data());
        this.fetchDropdownItems().then(() => this.getData());
      }
      if (change.type === 'modified') {
        console.log('Modified data: ', change.doc.data());
        this.fetchDropdownItems().then(() => this.getData());
      }
      if (change.type === 'removed') {
        console.log('Removed data: ', change.doc.data());
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

  const uniqueCombinations = new Set<string>();

  querySnapshot.docs.forEach(doc => {
    const data = doc.data();
    const dateObject = data['date'].toDate();
    const formattedDate = format(dateObject, 'dd/MM/yyyy');

    const combinedString = `${data['topic']} - ${data['subtopic']}- ${formattedDate}`;

   if (!this.dropdownItems.flatMap(v => v.id).includes(data['activityId'])) {
      uniqueCombinations.add(combinedString);

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
  
  const selectedItem = this.dropdownItems.find(item => item.id === this.selectedId);

  if (!selectedItem) {
    console.log('No such document!');
    return;
  }

  const compoundQuery = query(
    collection(db, 'Analytics'),
    where('activityId', '==', selectedItem.id)
  );
  const querySnapshot = await getDocs(compoundQuery);

  console.log(querySnapshot);

  let data = querySnapshot.docs.map(doc => doc.data());
  console.log('analitic data');
  console.log(data);
  this.groupOptions = ['sve', ...Array.from(new Set(data.map(item => item['group']))).sort((a, b) => a - b)];
  if(this.groupOptions.length > 2){
    
    this.selectedGroup = 'sve';
  }else{
    this.groupOptions = [];
    this.selectedGroup = '1';
  }

  let filteredData;
  filteredData = data;


  
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

  if (this.selectedGroup === 'sve') {
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
      this.createSeries(filteredData, filteredData.group-1);
    }else{
      for(let element in filteredData.results){
      this.createSeries(filteredData.results[element]);
      }
    }
  }

}

createSeries(element, groupIndex?) {
  let count = Object.keys(element).filter(key => key.includes(this.displayData)).length;
  let listdata = [];

  for(let i = 0; i < count; i++) {
    if (Array.isArray(element[this.displayData + i])) {
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
    color: this.selectedGroup === 'sve' ? this.colors[groupIndex]: undefined 
  });
}else{
  
  this.chartRef.addSeries({
    name: element.name,
    data: listdata.map((value) => ({
      y: value,
    })),
    type: 'line',
    color: this.selectedGroup === 'sve' ? this.colors[groupIndex]: undefined 
  });
  
}

let yAxisTitle = this.displayData.includes('Time') ? 'min' : '%';

if(this.displayData.includes('Time')){
  this.chartRef.zoomOut()
  this.chartRef.yAxis[0].update({
    labels: {
      formatter: function() {
          if (typeof this.value === 'number') {
              var minutes = Math.floor(this.value);
              var seconds = Math.floor((this.value - minutes) * 60);
              return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
          } else {
              return this.value;
          }
      }
  },
  plotLines: [{
    color: 'red', 
    width: 2, 
    //value: element['discussionTimeMax']
    label: {
       // text: element['discussionTimeMax'] + '- Maksimalno moguće vrijeme: ',
        align: 'right', 
        y: 12
    },
    zIndex: 5 
}],
  });
  this.chartRef.update({
    tooltip: {
    formatter: function() {
        if (typeof this.y === 'number') {
            var minutes = Math.floor(this.y);
            var seconds = Math.floor((this.y - minutes) * 60);
            return  this.series.name +': ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        } else {
            return this.y;
        }
    }
},
});

}
  else{
  this.chartRef.yAxis[0].update({
    labels: {
        formatter: function () {
         
            return this.value + '%'; 
        }
    },
    plotLines: [{
      color: 'red', 
      width: 2, 
      value: 100, 
      label: {
          text: '100% - Maksimum', 
          align: 'right', 
          y: 12
      },
      zIndex: 5 
  }],
  });
  this.chartRef.update({
    tooltip: {
      formatter: function () {
        return this.series.name + ': ' + this.y + '%'; 
    }
  },
});
}

  this.chartRef.yAxis[0].setTitle({
    text: yAxisTitle
  });


  


}


}
