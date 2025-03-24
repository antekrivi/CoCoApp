import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/User';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: AngularFirestore) { }

  saveUser(user: User){
    return this.firestore.collection('users').doc(user.id).set(user);
  }

  getUser(id: string): Observable<User | undefined> {
    return this.firestore.collection('users').doc<User>(id).valueChanges();
  }
  
}
