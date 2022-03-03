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
        User.findById(userid, (err, docs)=>{
            res.locals.currentUsername = docs.username;
            next();
        })
    }
});


// function sendMail(data, emailAdd, username) {
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         host: 'smtp.gmail.com',
//         auth: {
//             user: "form.handler.app@gmail.com",
//             pass: process.env.EMAIL_PASS,
//         },
//     });

//     const mailOptions = {
//         from: "form.handler.app@gmail.com",
//         to: emailAdd,
//         subject: `Form Data for ${username}`,
//         html: data
//     };
//     transporter.sendMail(mailOptions);
//     transporter.close();
// }

function sendMail(data, emailAdd, username) {
    console.log("data : ", data);
    console.log("email add : ", emailAdd);
    console.log("username : ", username);
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

app.get("/message", (req, res)=>{
    res.render("message");
})

app.get("/failed", (req, res) => {
    res.render("failed");
})

app.get("/url", requireLogin, (req, res) => {
    const uid = req.session.user_id;
    User.findById(uid, (err, docs) => {
        if (docs) {
            res.render("url", { username: docs.username, formids: docs.formsid });
        }
        else {
            res.render("message", {mgscode: "1"});
            // res.send("something wrong in /url");
        }
    })
})

app.post("/login", async (req, res) => {
    // const { username, password } = req.body;
    const username = "anubhav";
    const password = "anubhav";
    const foundUser = await User.findAndValidate(username, password)
    if (foundUser) {
        req.session.user_id = foundUser._id;
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } else {
        res.render("message", {mgscode: "2"});
        // res.send("Incorrent usernam/password")
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
    sendMail(mailData, "singhanubhav58@gmail.com", "Form Handler");
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
            res.render("message", {mgscode: "3"});
            // res.send("user already registered");
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
        redirectURL = "https://form-handler.singhanubhav.me/success";
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

app.post("/form/delete/:fid", (req, res) => {
    const fid = req.params.fid;
    console.log(fid);
    Form.findOneAndDelete({ formid: fid }, (err, docs) => {
        if (!err) {
            res.render("message", {mgscode: "4"});
            // res.send("form deleted");
        } else {
            res.render("message", {mgscode: "5"});
            // res.send("cannot delete the form");
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

app.post("/form/:user/:formid", (req, res) => {
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
    res.render("message", {mgscode: "6"});
    // res.send("Error 404")
});

app.listen(3000, () => {
    console.log("On Port 3000!!");
})


/* ToDos
Add login system, let logged in user create unlimited forms
dont let non logged in user create a form
add admin panel
show forms of certain user and let him delete it or edit it
*/