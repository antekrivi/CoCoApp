import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  calculateAccuracy(element, iteration, numberOfPossibleAnswers) : number {
    let markedCorrect = element['markedCorrect' + iteration] || 0;
    let unmarkedCorrect = element['unmarkedCorrect' + iteration] || 0;
    let markedIncorrect = element['markedIncorrect' + iteration] || 0;
    let unmarkedIncorrect = numberOfPossibleAnswers - markedCorrect - unmarkedCorrect - markedIncorrect || 0;

    let total = numberOfPossibleAnswers || markedCorrect + unmarkedCorrect + markedIncorrect; //written this way to support legacy analytics data that does not contain numberOfPossibleAnswers
    let accuracy = markedCorrect ? ((markedCorrect + unmarkedIncorrect) / total) * 100 : 0;

    return Number(accuracy.toFixed(2))
  }

  constructor() { }
}
