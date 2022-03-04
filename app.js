const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const app = express();
const session = require('express-session');
const dotenv = require('dotenv')
dotenv.config()
const ShortUniqueId = require("short-unique-id");
const User = require('./models/user');
const Form = require('./models/form');
app.set("view engine", 'ejs');
app.set("views", "views");
app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.DB_URL)
    .then(() =>
        console.log("Mongoose Connection Open"))
    .catch(err =>
        console.log("Error : ", err))

app.use(session({
    secret: process.env.SECRET,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    saveUninitialized: true,
    resave: true
}));

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
}

app.use((req, res, next) => {
    res.locals.url = req.url;
    if (!req.session.user_id) {
        res.locals.currentUser = "";
        res.locals.currentUsername = "";
        next();
    } else {
        res.locals.currentUser = req.session.user_id;
        const userid = req.session.user_id;
        User.findById(userid, (err, docs) => {
            res.locals.currentUsername = docs.username;
            next();
        })
    }
});


function sendMail(data, emailAdd, username) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: "form.handler.app@gmail.com",
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: "form.handler.app@gmail.com",
        to: emailAdd,
        subject: `Form Data for ${username}`,
        html: data
    };
    transporter.sendMail(mailOptions);
    transporter.close();
}

app.get("/", (req, res) => {
    res.render("home");
})

app.get("/success", (req, res) => {
    res.render("success");
})

app.get("/contact", (req, res) => {
    res.render("contact");
})

app.get("/how-to-use", (req, res) => {
    res.render("how-to-use");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/message", (req, res) => {
    res.render("message");
})

app.get("/failed", (req, res) => {
    res.render("failed");
})

app.get("/admin", requireLogin, (req, res) => {
    const uid = req.session.user_id;
    User.findById(uid, (err, docs) => {
        if (docs.isAdmin === true) {
            User.find({}, (err, userdocs) => {
                res.render("admin", { userdocs });
            })

        } else {
            res.render("message", { msgcode: "7" });
        }
    })
})

app.get("/url", requireLogin, (req, res) => {
    const uid = req.session.user_id;
    User.findById(uid, (err, docs) => {
        if (docs) {
            res.render("url", { username: docs.username, formids: docs.formsid });
        }
        else {
            res.render("message", { msgcode: "1" });
        }
    })
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password)
    if (foundUser) {
        req.session.user_id = foundUser._id;
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } else {
        res.render("message", { msgcode: "2" });
    }
})

app.post("/contact", (req, res) => {
    const data = Object.entries(req.body);
    let mailData = `Contact Form Submission `;
    mailData += `<br>---------------------------<br>`;
    for (let i = 0; i < data.length; i++) {
        mailData += data[i][0].toUpperCase() + " : " + data[i][1] + "<br>";
    }
    mailData += `---------------------------<br>`;
    sendMail(mailData, "admin@formhandler.cf", "Form Handler");
    res.render("success");
})

app.post("/register", (req, res) => {
    const { username, password, name, email, phoneNum } = req.body;
    let isAdmin = false;
    if (username === 'anubhav') {
        isAdmin = true;
    } else {
        isAdmin = false;
    }
    User.find({ username: username }, async (err, docs) => {
        if (docs.length) {
            res.render("message", { msgcode: "3" });
        } else {
            const user = new User({
                username, password, name, email, phoneNum, isAdmin
            })
            await user.save();
            req.session.user_id = user._id;
            res.redirect("/");
        }
    })
})

app.get("/create-forms", requireLogin, (req, res) => {
    res.render("create-forms");
})

app.post("/create-forms", requireLogin, (req, res) => {
    let { formTitle, redirectURL } = req.body;
    if (redirectURL === "") {
        redirectURL = "https://formhandler.cf/success";
    }
    const shortid = new ShortUniqueId({ length: 10 });
    let uuid = shortid();
    const uid = req.session.user_id;
    User.findByIdAndUpdate(uid, {
        $push: {
            formsid: uuid
        }
    }, (err, userdocs) => {
        if (err) {
            console.log(err);
        } else {
            Form.create({ formTitle: formTitle, redirectUrl: redirectURL, formid: uuid, username: userdocs.username }, (err, docs) => {
                if (err) {
                    console.log(err);
                }
                else {
                    res.render("url", { docs });
                }
            })
        }
    })
})

app.get("/form/:user", requireLogin, (req, res) => {
    const username = req.params.user;
    User.findOne({ username }, (err, docs) => {
        if (docs) {
            Form.find({ username }, (err, docs) => {
                res.render("user", { docs });
            })
        } else {
            res.render("user", { docs });
        }
    })
})

app.post("/form/delete/:fid", requireLogin, (req, res) => {
    const fid = req.params.fid;
    const uidd = req.session.user_id;
    Form.findOneAndDelete({ formid: fid }, (err, docs) => {
        if (docs) {
            User.findByIdAndUpdate(uidd, {
                $pull: {
                    formsid: fid
                }
            }, (err, userdocs) => {
                if (userdocs) {
                    res.render("message", { msgcode: "4" });
                } else {
                    res.render("message", { msgcode: "5" });
                }
            })
        } else {
            res.render("message", { msgcode: "5" });
        }
    })
})

app.get("/form/:user/:formid", requireLogin, (req, res) => {
    const username = req.params.user;
    const formid = req.params.formid;
    User.findOne({ username }, (err, docs) => {
        if (docs) {
            if (docs.formsid.indexOf(formid) !== -1) {
                res.json({
                    status: "success",
                    desciption: "form is current active and accepting submittions"
                })
            } else {
                res.json({
                    status: "failed",
                    desciption: "form is not accepting submittions"
                })
            }
        } else {
            res.json({
                status: "failed",
                desciption: "form is not yet created"
            })
        }
    })
})

app.post("/:user/:formid", (req, res) => {
    const username = req.params.user;
    const formid = req.params.formid;
    User.findOne({ username }, (err, userdocs) => {
        if (userdocs) {
            if (userdocs.formsid.indexOf(formid) !== -1) {
                Form.findOne({ formid }, (err, docs) => {
                    if (docs) {
                        const data = Object.entries(req.body);
                        let mailData = `Form Submission for ${username} `;
                        mailData += `<br>---------------------------<br>`;
                        for (let i = 0; i < data.length; i++) {
                            mailData += data[i][0].toUpperCase() + " : " + data[i][1] + "<br>";
                        }
                        mailData += `---------------------------<br>`;
                        sendMail(mailData, userdocs.email, username);
                        res.redirect(docs.redirectUrl);
                    }
                })
            } else {
                res.json({
                    status: "failed",
                    desciption: "form is not accepting submittions"
                })
            }
        } else {
            res.json({
                status: "failed",
                desciption: "form is not yet created"
            })
        }
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})
app.get("*", (req, res) => {
    res.render("message", { msgcode: "6" });
});

app.listen(process.env.PORT, () => {
    console.log("Server Started!!");
})