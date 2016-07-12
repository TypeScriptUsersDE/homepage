import {Component, OnInit} from '@angular/core';
import {NgForm, Control, Validators, FormBuilder, ControlGroup}    from '@angular/common';
import {Http} from '@angular/http';
import {Headers, RequestOptions} from '@angular/http';
import {User} from '../../../components/User';
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from '@angular/router';
import {AuthHttp} from 'angular2-jwt';

@Component({
    selector: 'user-message',
    templateUrl: './routes/user/message/user.message.html',
    directives: [ROUTER_DIRECTIVES],
    providers: []
})

export class UserMessageComponent implements OnInit {
    required:Control;
    form:ControlGroup;

    model:{
        username?:string,
        subject?:string,
        message?:string
    };

    constructor(private router:Router,
                private route:ActivatedRoute,
                public http:Http,
                public authHttp:AuthHttp,
                private builder:FormBuilder) {

        this.required = new Control("", Validators.required);
        this.form = builder.group({
            required: this.required
        });

        this.model = {};
    }

    user = new User();
    body:{
        username?:string
    };

    ngOnInit() {
        this.body = {};

        this.route
            .params
            .subscribe(
                params => {
                    this.body.username = params['username'];
                }
            );

        let headers = new Headers({'Content-Type': 'application/json'});
        let options = new RequestOptions({headers: headers});

        this.authHttp.post('/api/user/get',
            JSON.stringify(this.body),
            options)
            .map(res => res.json())
            .subscribe(
                data => this.user = data,
                error => console.log(error)
            );
    }

    onSubmit() {
        this.route
            .params
            .subscribe(
                params => {
                    this.model.username = params['username'];
                }
            );

        let headers = new Headers({'Content-Type': 'application/json'});
        let options = new RequestOptions({headers: headers});

        this.authHttp.post('/api/user/send/mail', JSON.stringify(this.model), options)
            .map(res => {
                let body = res.json();
                return body
            })
            .subscribe(
                data => {
                    this.router.navigate(['/single', this.model.username]);
                },
                error => console.log(error)
            );
    }
}