import { Injectable } from '@angular/core';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { BehaviorSubject } from 'rxjs';

const firebaseConfig = {
  apiKey: "AIzaSyDcFmO6DWuv5I1JAG3Xbf5ShqOpeiIk9ZE",
  authDomain: "coco-29838.firebaseapp.com",
  databaseURL: "https://coco-29838-default-rtdb.firebaseio.com",
  projectId: "coco-29838",
  storageBucket: "coco-29838.appspot.com",
  messagingSenderId: "286635283337",
  appId: "1:286635283337:web:6fb0743d4779e4744f8758",
  measurementId: "G-F8BNDEKQZR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db = getFirestore(app);

  getDb() {
    return this.db;
  }

  constructor() { }
}