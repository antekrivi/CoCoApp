import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RadnjaService {
  action: string = '';
  selectedTheme: Object = {
    id: '',
    theme: '',
    subject: ''
  };
  selectedSubtheme: Object = {
    id: '',
    title: '',
    class: 1
  };
  type: string = '';
}