import {Component, OnInit} from '@angular/core';
import {Http} from '@angular/http';
import {Router, ActivatedRoute, ROUTER_DIRECTIVES} from '@angular/router';
import {User} from '../../components/User';
import {AuthService} from '../../services/AuthService';
import {LinkyPipe} from 'angular2-linky';

@Component({
    selector: 'single',
    templateUrl: './routes/single/single.html',
    directives: [ROUTER_DIRECTIVES],
    providers: [AuthService],
    pipes: [LinkyPipe]
})

export class SingleComponent implements OnInit {
    sendMessageText:string;

    constructor(public http:Http,
                private router:Router,
                private authService:AuthService,
                private route:ActivatedRoute) {
        
    }

    user = new User();
    body:{
        username?:string
    };

    ngOnInit() {
        this.user = this.route.snapshot.data['user'];

        if (this.authService.isLoggedIn()) {
            this.sendMessageText = "Nachricht senden";
        } else {
            this.sendMessageText = "Mit GitHub anmelden";
        }
    }

    isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    hasTecSelected() {
        let result = true;

        for (let i in this.user.tec) {
            if (this.user.tec[i] === false) {
                result = false;
                break;
            }
        }

        return result
    }

    sendMessage(username:string) {
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/user/message', username]);
        } else {
            this.authService.login();
        }
    }
}