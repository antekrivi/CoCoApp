import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RadnjaService {
  radnja: string = '';
  odabranaTema: Object = {
    id: '',
    tema: '',
    predmet: ''
  };
  odabranaPodtema: Object = {
    id: '',
    naziv: '',
    razred: 0
  odabranaActivity: Object = {
    id: '',
  };
  odgovorTip: string = '';
    naziv: ''
  }
  constructor() { }
}