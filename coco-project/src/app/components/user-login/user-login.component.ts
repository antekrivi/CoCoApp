import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {

  email: string = '';
  password: string = '';

  constructor(private authService: AuthService,
    private router: Router) { }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      alert('Uspješno ste prijavljeni!');
      this.router.navigate(['/home']);
    }
    catch (error) {
      console.error(error.code);
      alert('Prijava nije uspjela! \n' + error.code);
    }
  }
}
