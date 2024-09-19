import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAOYowA6Kjw1-Ss2e0otw--B9Rwa8w6XlI",
  authDomain: "coco-2024.firebaseapp.com",
  projectId: "coco-2024",
  storageBucket: "coco-2024.appspot.com",
  messagingSenderId: "614050471182",
  appId: "1:614050471182:web:759cf6910659c25e260b5f",
  measurementId: "G-V602CC9FVQ"
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
