import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from './user.model';
import API_KEY from './apikey.js';

export interface AuthResponseData {
    kind: string;
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    user = new BehaviorSubject<User>(null);
    sign_up_url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    login_url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`

    private tokenExpirationTimer: any;
    constructor(private http: HttpClient, private router: Router) {

    }
    signUp(email: string, password: string) {
        return this.http.post<AuthResponseData>(this.sign_up_url,
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap(resData => {
            this.handleAuthenticaiton(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        }));
    }

    login(email: string, password: string) {
        return this.http.post<AuthResponseData>(this.login_url,
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap(resData => {
            this.handleAuthenticaiton(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        }));
    }

    autoLogin() {
        const userData: {
            email: string;
            id: string;
            _token: string;
            _tokenExpirationDate: string;
        } = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            return;
        }
        const loadedUser = new User(userData.email, userData.id, userData._token,
            new Date(userData._tokenExpirationDate));
        if (loadedUser.token) {
            this.user.next(loadedUser);
            const expirationDuraton = 
            new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuraton);
        }
    }

    logout() {
        this.user.next(null);
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
    }

    autoLogout(expirationDuraton: number) {
        this.tokenExpirationTimer = setTimeout(() => {
            this.logout();
        }, expirationDuraton);
    }

    private handleAuthenticaiton(email: string, localId: string, token: string, expiresIn: number) {
        const expDate = new Date(new Date().getTime() + expiresIn * 1000);
        const user = new User(email, localId, token, expDate);
        this.user.next(user);
        this.autoLogout(expiresIn * 1000);
        localStorage.setItem('userData', JSON.stringify(user));
    }
    private handleError(errorRes: HttpErrorResponse) {
        let errorMessage = 'An Unknown error Occured!';
        if (!errorRes.error || !errorRes.error.error) {
            return throwError(errorMessage);
        }
        switch (errorRes.error.error.message) {
            case 'EMAIL_EXISTS':
                errorMessage = "Email Already Exists!"
                break;
            case 'OPERATION_NOT_ALLOWED':
                errorMessage = "OPERATION NOT ALLOWED!"
                break;
            case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                errorMessage = "TOO MANY ATTEMPTS TRY LATER!"
                break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = "EMAIL NOT FOUND!"
                break;
            case 'INVALID_PASSWORD':
                errorMessage = "INVALID PASSWORD!"
                break;
            case 'USER_DISABLED':
                errorMessage = "USER DISABLED!"
                break;
        }
        return throwError(errorMessage);
    }
}