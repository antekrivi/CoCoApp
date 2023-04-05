import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDcFmO6DWuv5I1JAG3Xbf5ShqOpeiIk9ZE",
  authDomain: "coco-29838.firebaseapp.com",
  databaseURL: "https://coco-29838-default-rtdb.firebaseio.com",
  projectId: "coco-29838",
  storageBucket: "gs://coco-29838.appspot.com/",
  messagingSenderId: "286635283337",
  appId: "1:286635283337:web:6fb0743d4779e4744f8758",
  measurementId: "G-F8BNDEKQZR"
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