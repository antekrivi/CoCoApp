import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBKgE753MMwSt7j9_HYApITFzLP9Caim4I",
  authDomain: "coco2023-e4c25.firebaseapp.com",
  projectId: "coco2023-e4c25",
  storageBucket: "coco2023-e4c25.appspot.com",
  messagingSenderId: "656977787904",
  appId: "1:656977787904:web:d186dd7b6ddf1e18136ce5",
  measurementId: "G-CR634S4HVF"

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