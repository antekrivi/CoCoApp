import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RadnjaService {
  radnja: string = '';
  odabranaTema: Object = {
    id: '',
    tema: ''
  };
  odabranaPodtema: Object = {
    id: '',
    naziv: ''
  }
  constructor() { }
}


