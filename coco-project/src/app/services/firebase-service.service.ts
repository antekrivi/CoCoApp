import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJsoNmLzItMwt5hvOkFNgfkhAxm4xhXms",
  authDomain: "coco-be1e5.firebaseapp.com",
  projectId: "coco-be1e5",
  storageBucket: "coco-be1e5.appspot.com",
  messagingSenderId: "59832380661",
  appId: "1:59832380661:web:551933e71c9e93ba4869bc",
  measurementId: "G-DS6GRSWVR7"

};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  getDb() {
    return db;
  }

  getStorage() {
    return storage;
  }

  constructor() { }
}