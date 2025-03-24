import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/User';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  user$: Observable<firebase.default.User | null>;

  constructor(private afAuth: AngularFireAuth, private userService: UserService) {
    this.user$ = this.afAuth.authState;
  }

  // Registracija učitelja i spremanje u Firestore
  async register(email: string, password: string, fullName: string, school: string) {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    if (userCredential.user) {
      const newUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        fullName: fullName,
        school: school,
        createdAt: new Date()
      };
      await this.userService.saveUser(newUser);
    }
  }

  // Prijava korisnika
  async login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Odjava korisnika
  logout() {
    return this.afAuth.signOut();
  }

  // Dohvati trenutno prijavljenog korisnika
  getCurrentUser() {
    return this.afAuth.currentUser;
  }
}
