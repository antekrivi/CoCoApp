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
import * as Highcharts from 'highcharts';
import { format } from 'date-fns';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css'],
})
export class StatisticsComponent implements OnInit {
  @ViewChild('myChart') componentRef;
  colors = [
    '#2caffe',
    '#544fc5',
    '#00e272',
    '#fe6a35',
    '#6b8abc',
    '#d568fb',
    '#2ee0ca',
    '#fa4b42',
    '#feb56a',
    '#91e8e12',
  ];
  unsubscribeFromFirestore: () => void;

  chartRef;
  updateFlag;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      height: 700,
    },
    title: {
      text: '',
    },
    tooltip: {},
    xAxis: {
      tickInterval: 1,
      labels: {
        formatter: function () {
          if (typeof this.value == 'number') {
            return this.value + 1 + '';
          } else {
            return this.value;
          }
        },
      },
    },
    yAxis: {
      tickInterval: 1,
      labels: {
        formatter: function () {
          if (typeof this.value == 'number') {
            return this.value + 1 + '';
          } else {
            return this.value;
          }
        },
      },
    },
    series: [],
  };

  documentIds: any[];
  data: any;
  selectedId: string = null;
  IRTflag: boolean = false;
  displayData: string = 'accuracy';
  dropdownItems: {
    id: string;
    displayText: string;
    topic: string;
    subtopic: string;
    date: Date;
  }[] = [];

  selectedGroup: string = 'sve';
  groupOptions: string[] = [];
  sidebarData: any = [];

  constructor() {}

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
    this.groupOptions = [
      'sve',
      ...Array.from(new Set(data.map((item) => item['group']))).sort(
        (a, b) => a - b
      ),
    ];
    if (this.groupOptions.length > 2) {
      this.selectedGroup = 'sve';
    } else {
      this.groupOptions = [];
      this.selectedGroup = '1';
    }

    let filteredData;
    filteredData = data;

    this.data = filteredData;
    this.updateChart();
  }

  updateChartData(): void {
    this.chartRef.series[0].update({
      type: 'column',
    });
  }

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    this.chartRef = chart;
  };

  a;
  removeSeries() {
    while (this.chartRef.series.length != 0) {
      this.chartRef.series[0].destroy();
    }
  }
  updateChart(button?) {
    this.sidebarData = [];
    this.removeSeries();
    if (button != null) {
      if (button === 1) {
        this.displayData = 'accuracy';
      } else if (button === 2) {
        this.displayData = 'resolutionTime';
      } else if (button === 3) {
        this.displayData = 'discussionTimes';
      }
    }

    if (this.selectedGroup === 'sve') {
      for (let groupIndex in this.data) {
        let groupData = this.data[groupIndex].results;

        if (this.displayData == 'discussionTimes') {
          this.createSeries(this.data[groupIndex], Number(groupIndex));
        } else {
          for (let element of groupData) {
            this.createSeries(element, Number(groupIndex));
          }
        }
      }
    } else {
      let filteredData = this.data.filter(
        (item) => item['group'] === Number(this.selectedGroup)
      )[0];

      if (this.displayData == 'discussionTimes') {
        this.createSeries(filteredData, filteredData.group - 1);
      } else {
        for (let element in filteredData.results) {
          this.createSeries(
            filteredData.results[element],
            Number(this.selectedGroup) - 1
          );
          this.fillSideBar(filteredData.results[element]);
        }
      }
    }
  }
  fillSideBar(element) {
    let count = Object.keys(element).filter((key) =>
      key.includes('resolutionTime')
    ).length;

    let repetitions = [];
    for (let i = 0; i < count; i++) {
      let markedCorrect = element['markedCorrect' + i] || 0;
      let unmarkedCorrect = element['unmarkedCorrect' + i] || 0;
      let markedIncorrect = element['markedIncorrect' + i] || 0;

      repetitions.push({
        markedCorrect: markedCorrect,
        unmarkedCorrect: unmarkedCorrect,
        markedIncorrect: markedIncorrect,
      });
    }
    this.sidebarData.push({
      name: element.name,
      repetitions: repetitions,
    });
  }

  createSeries(element, groupIndex?) {
    let count = Object.keys(element).filter((key) =>
      key.includes(this.displayData)
    ).length;

    if (this.displayData == 'discussionTimes') {
      this.chartRef.addSeries({
        name: 'Grupa ' + (groupIndex + 1),
        data: element[this.displayData],
        type: 'line',
        color: this.selectedGroup == 'sve' ? this.colors[groupIndex] : null,
      });

      for (let i = 0; i < count; i++) {
        let formattedTime = `${Math.floor(
          element['discussionTimesMax'][i] / 60
        )}:${(element['discussionTimesMax'][i] % 60)
          .toString()
          .padStart(2, '0')}`;

        this.chartRef.yAxis[0].update({
          plotLines: [
            {
              color: 'red',
              width: 2,
              value: element['discussionTimesMax'][i],
              label: {
                text:
                  'Maksimalno vrijeme za ' +
                  Number(i + 1) +
                  '. iteraciju: ' +
                  formattedTime,
                align: 'right',
                y: 12,
              },
              zIndex: 5,
            },
          ],
        });
      }
    } else if (this.displayData == 'accuracy') {
      let count = Object.keys(element).filter((key) =>
        key.includes('resolutionTime')
      ).length;
      let accuracyData = [];
      for (let i = 0; i < count; i++) {
        let markedCorrect = element['markedCorrect' + i] || 0;
        let unmarkedCorrect = element['unmarkedCorrect' + i] || 0;
        let markedIncorrect = element['markedIncorrect' + i] || 0;

        let total = markedCorrect + unmarkedCorrect + markedIncorrect;
        let accuracy = markedCorrect ? (markedCorrect / total) * 100 : 0;
        accuracyData.push(accuracy);
      }

      this.chartRef.addSeries({
        name: element.name,
        data: accuracyData,
        type: 'line',
        color: this.selectedGroup == 'sve' ? this.colors[groupIndex] : null,
      });
    } else if (this.displayData == 'resolutionTime') {
      let resolutionTimesData = [];
      for (let i = 0; i < count; i++) {
        if (Array.isArray(element['resolutionTime' + i])) {
          let sum = element['resolutionTime' + i].reduce(
            (total, value) => total + value,
            0
          );
          resolutionTimesData.push(sum);
        } else {
          resolutionTimesData.push(element['resolutionTime' + i] || 0);
        }
      }

      this.chartRef.addSeries({
        name: element.name,
        data: resolutionTimesData,
        type: 'line',
        color: this.selectedGroup == 'sve' ? this.colors[groupIndex] : null,
      });
    }

    let yAxisTitle = this.displayData.includes('Time') ? 'min' : '%';

    this.chartRef.yAxis[0].setTitle({ text: yAxisTitle });
    if (this.displayData.includes('Time')) {
      this.chartRef.zoomOut();
      this.chartRef.yAxis[0].update({
        tickInterval: 15,
        labels: {
          formatter: function () {
            var minutes = Math.floor(this.value / 60);
            var seconds = this.value % 60;
            return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
          },
        },
      });
      if (this.displayData.includes('resolutionTime')) {
        for (let i = 0; i < count; i++) {
          let filteredData = this.data.filter(
            (item) => item['group'] === Number(groupIndex + 1)
          )[0];
          let formattedTime = `${Math.floor(
            filteredData['resolutionTimesMax'][i] / 60
          )}:${(filteredData['resolutionTimesMax'][i] % 60)
            .toString()
            .padStart(2, '0')}`;
          this.chartRef.yAxis[0].update({
            plotLines: [
              {
                color: 'red',
                width: 2,
                value: filteredData['resolutionTimesMax'][i],
                label: {
                  text:
                    'Maksimalno vrijeme za ' +
                    Number(i + 1) +
                    '. iteraciju: ' +
                    formattedTime,
                  align: 'right',
                  y: 12,
                },
                zIndex: 5,
              },
            ],
          });
        }
      } else {


        this.chartRef.update({
          tooltip: {
            formatter: function () {
              if (typeof this.y === 'number') {
                var minutes = Math.floor(this.y / 60);
                var seconds = Math.floor(this.y % 60);
                return (
                  this.series.name +
                  ': ' +
                  minutes +
                  ':' +
                  (seconds < 10 ? '0' : '') +
                  seconds
                );
              } else {
                return this.y;
              }
            },
          },
        });
      }
    } else {
      this.chartRef.yAxis[0].update({
        text: yAxisTitle,
        tickInterval: 5,
        labels: {
          formatter: function () {
            return this.value + '%';
          },
        },
        plotLines: [
          {
            color: 'red',
            width: 2,
            value: 100,
            label: {
              text: '100% - Maksimum',
              align: 'right',
              y: 12,
            },
            zIndex: 5,
          },
        ],
      });
      this.chartRef.update({
        tooltip: {
          formatter: function () {
            return this.series.name + ': ' + this.y + '%';
          },
        },
      });
    }
    this.chartRef.xAxis[0].setTitle({ text: 'Iteracija' });
  }
  lighten(color, percent) {
    var num = parseInt(color.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      B = ((num >> 8) & 0x00ff) + amt,
      G = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
        (G < 255 ? (G < 1 ? 0 : G) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }
}
