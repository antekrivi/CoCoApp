import { Component } from '@angular/core';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css']
})
export class UserRegisterComponent {

  email: string = '';
  fullName: string = '';
  school: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private authService : AuthService, private router : Router) { }


  async register(){
    if(this.password !== this.confirmPassword){
      alert('Lozinke se ne podudaraju!');
      return;
    }

    try{
      await this.authService.register(this.email, this.password, this.fullName, this.school);
      alert('Registracija uspješna!');
      this.router.navigate(['/login']);
    }
    catch(error){
      alert('Registracija nije uspjela!');
      console.error(error);
    }
  }
}
