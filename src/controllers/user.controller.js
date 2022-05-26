const UserModel = require('../models/user.model.js');
const converViet = require('../config/function/ConverViet');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const { unlink } = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Google Auth
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// [JWT sign]
// Default algorithm: HMAC SHA256
const JWTPrivateKey = process.env.JWT_PRIVATE_KEY;

//===========================
class userController {

    // [GET] /user/login
    login(req, res, next) {
        res.render('login', { client_id: GOOGLE_CLIENT_ID });
    }

    // [GET] /user/register
    register(req, res, next) {
        res.render('register');
    }

    // [POST] /user/auth/google-login
    async verifyGoogleLogin(req, res, next) {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const google_token = req.body.credential;
        console.log(google_token);
        try {
            const ticket = await client.verifyIdToken({
                idToken: google_token,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const email = payload.email;
            const existingUser = await UserModel.findOne({ email: email });

            if (existingUser) {
                let token = jwt.sign({ email: email }, JWTPrivateKey, { expiresIn: '3h' });
                res.cookie('session-token', token);
                if (!existingUser.picture.image_url) {
                    existingUser.picture.name = `/upload/avatar/${existingUser.picture.name}`;
                }

                if (existingUser.username) {
                    res.redirect('/chat');
                }
            } else {
                const { email, given_name, family_name, picture, email_verified } = payload;
                let userRecord = new UserModel({
                    username: removeVietnameseTones(given_name),
                    email: email,
                    given_name: given_name,
                    family_name: family_name,
                    picture: {
                        name: picture,
                        image_url: true,
                    },
                    email_verified: email_verified,
                });
                userRecord.save()
                    .then((user) => {
                        let token = jwt.sign({ email: email }, JWTPrivateKey, { expiresIn: '3h' });
                        res.cookie('session-token', token);
                        if (!user.picture.image_url) {
                            user.picture.name = `/upload/avatar/${user.picture.name}`;
                        }
                        res.redirect('/chat');
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            is_correct: false,
                            enough_data: false,
                            account_status: undefined,
                            message: 'Error when saving user information to DB: ' + err.message,
                            user_data: undefined,
                            token: undefined
                        });
                    });
            }


            function removeVietnameseTones(str) {
                str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
                str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
                str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
                str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
                str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
                str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
                str = str.replace(/đ/g,"d");
                str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
                str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
                str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
                str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
                str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
                str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
                str = str.replace(/Đ/g, "D");
                // Some system encode vietnamese combining accent as individual utf-8 characters
                // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
                str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
                str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
                // Remove extra spaces
                // Bỏ các khoảng trắng liền nhau
                str = str.replace(/ + /g," ");
                str = str.trim();
                // Remove punctuations
                // Bỏ dấu câu, kí tự đặc biệt
                str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
                return str;
                }
            

        }
        catch (err) {
            console.log(err);
            res.status(500).json({
                is_correct: false,
                enough_data: undefined,
                account_status: undefined,
                message: 'Error when verifying Google account: ' + err.message,
                user_data: undefined,
                token: undefined,
            });
        }
    }

    // [GET] /user/logout
    logout(req, res, next) {
        res.clearCookie('session-token');
        res.status(200).json({
            message: 'Logout successfully',
        })
    }

    // [POST] /user/get-me
    getLoggedInUserData(req, res, next) {
        const user = req.user;
        if (user) {
            res.status(200).json({
                message: 'Get user data successfully',
                user_data: user
            });
        } else {
            res.status(404).json({
                message: 'Something wrong',
                user_data: null
            })
        }
    }

    // [GET] /user/get/:id
    getUserDataById(req, res, next) {
        const user_id = req.params.id;
        UserModel.findById(user_id) 
            .then(user => {
                if (! user) {
                    return res.status(404).json({
                        message: "No user found",
                        user: null,
                        error: null,
                    })
                }
                else {
                    return res.status(200).json({
                        message: "Get user by id successfully",
                        user: user, 
                        error: null,
                    })
                }
            })
            .catch(err => {
                res.status(500).json({
                    message: "Error from server",
                    user: null,
                    error: err.message,
                })
            })
    }
    // [POST] /user/update
    updateSettings(req, res, next) {
        const user = req.user;
        const { _id, picture } = user;
        const { username, given_name, family_name, gender, phone, role } = req.body;

        let filename = undefined;

        const oldFilePath = path.join(__dirname, '..', 'public', picture.name);
        if (req.file) {
            if (fs.existsSync(oldFilePath)) {
                unlink(oldFilePath, err => {
                    if (err) {
                        res.status(500).json({ 
                            message: `Error when deleting an existed image`, 
                            error: err.message 
                        });
                    }
                });
            }
            filename = req.file.filename;
        }

        UserModel.findByIdAndUpdate(_id, {
            username: username || user.username,
            picture: {
                name: filename || user.picture.name,
                image_url: !filename,
            },
            given_name: given_name || user.given_name,
            family_name: family_name || user.family_name,
            gender: gender || user.gender,
            phone: phone || user.phone,
            role: role || user.role
        })
            .then(user => {
                res.status(200).json({ 
                    message: `Change user settings successfully`,
                    error: null,
                });
            })
            .catch(err => {
                res.status(500).json({ 
                    message: `Error when saving user settings to DB`, 
                    error: err.message 
                });
            })
    }
}

module.exports = new userController();
