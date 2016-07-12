import express = require("express");
import jwt = require("jsonwebtoken");
import _ = require("lodash/index");
import {JwtRequest} from "./../common/interfaces/JwtRequest";
import request = require("request-promise");
import {model as UserModel} from "./../models/User";
import {User} from "./../models/User";
import Config from "../config/config";

// todo: use IJwtRequest
interface location {
    lat: string,
    lng: string
}

class UserCtrl {

    publicRoutes(app:express.Application, baseRoute:string) {
        app.post(baseRoute + "/get", this.getSingleUser);
        app.get(baseRoute + "/get/all", this.getUsers);
        app.get(baseRoute + "/get/map", this.getUserCoordinates);
    }

    protectedRoutes(app:express.Application, baseRoute:string) {
        app.put(baseRoute + "/update", this.updateUser);
        app.get(baseRoute + "/get/form", this.getUserForm);
        app.post(baseRoute + "/send/mail", this.sendMessage);
    }

    getSingleUser(req:JwtRequest, res:express.Response) {
        
        UserModel.findOne({$and: [{"_id": req.body.id}, {"active": true}]})
            .exec(done);

        function done(err:any, result:User) {
            if (err) {
                console.log("err");
                return
            }

            //don't give users email adress to client
            //todo: also for sensitive data

            delete result.email;

            res
                .status(200)
                .json(result);
        }
    }

    // this allows an authenticated user to get his own data, if he still is active
    getUserForm(req:JwtRequest, res:express.Response) {

        UserModel.findOne()
            .where({"github_id": req.decoded.github_id})
            .exec(done);

        function done(err:any, result:User) {
            if (err) {
                console.log("err");
                return
            }

            res
                .status(200)
                .json(result);
        }
    }

    getUsers(req:express.Request, res:express.Response) {

        UserModel
            .find({"active": true})
            .exec(done);

        function done(err:any, result:User) {
            if (err) {
                console.log("err");
                return
            }

            res
                .status(200)
                .json(result);
        }
    }

    getUserCoordinates(req:express.Request, res:express.Response) {
        var coordinates:location[] = [];

        UserModel
            .find({"active": true})
            .exec(done);

        function done(err:any, result:User) {
            if (err) {
                console.log("err");
                return
            }

            _.forEach(result, function (user, key) {
                coordinates.push({
                    lat: user.latitude,
                    lng: user.longitude
                })
            });

            res
                .status(200)
                .json(coordinates);
        }
    }

    sendMessage(req:JwtRequest, res:express.Response) {
        console.log(req.body);
        console.log(Config.mailgun_api_key);

        UserModel
            .findOne({"_id": req.body.id})
            .exec(done);

        function done(err:any, result:User):any {
            if (err) {
                console.log("err");
                return
            }
            if (result) {
                console.log(result);
                let headers = {
                    Authorization: 'Basic ' + new Buffer('api:' + Config.mailgun_api_key).toString("base64")
                };

                let payload = {
                    from: Config.mailgun_sender_email,
                    //todo: override to not spam anyone
                    // to: 'strauss@w11k.de',
                    to: result.email,
                    subject: req.body.subject,
                    text: req.body.message
                };

                request.post({
                    url: 'https://api.mailgun.net/v3/' + Config.mailgun_domain + '/messages',
                    headers: headers,
                    formData: payload
                })
                    .then(function (data:any) {
                        console.log(data);
                    });
            }

        }
    }


    updateUser(req:JwtRequest, res:express.Response) {

        UserCtrl.getCoordinates(req.body.city)
            .then(function (result:any) {
                result = JSON.parse(result);

                UserModel.findOneAndUpdate({
                    "github_id": req.decoded.github_id
                }, {
                    "name": req.body.name,
                    "website": req.body.website,
                    "twitter": req.body.twitter,
                    "description": req.body.description,
                    "city": req.body.city,
                    "zip": req.body.zip,
                    "tec": req.body.tec,
                    "active": true,
                    "longitude": result.results[0].geometry.location.lng,
                    "latitude": result.results[0].geometry.location.lat
                }, {
                    "new": true
                }, done);
            });

        function done(err:any, result:User) {
            if (err) {
                console.log("err");
                return;
            }

            res
                .status(200)
                .json("user data updated");
        }
    }

    static
    getCoordinates(location:string):any {
        return request.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(location))
    }


}

export default new UserCtrl();