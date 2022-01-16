const express = require("express");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
const dotenv = require('dotenv')
dotenv.config()
app.set("view engine", 'ejs');
app.set("views", "views");
app.use(express.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(express.static("public"));
app.use((req, res, next) => {
    res.locals.url = req.url;
    next();
});

mongoose.connect(process.env.DB_URL)
    .then(() => {
        console.log("Mongoose Connection Open");
    })
    .catch(err => {
        console.log("Error : ", err);
    })

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    redirecturl: String
});
const User = mongoose.model('User', userSchema);

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

app.get("/failed", (req, res) => {
    res.render("failed");
})

app.post("/contact", (req, res) => {
    const data = Object.entries(req.body);
    let mailData = `Contact Form Submission <br>---------------------------<br>`;
    for (let i = 0; i < data.length; i++) {
        mailData += data[i][0].toUpperCase() + " : " + data[i][1] + "<br>";
    }
    mailData += `---------------------------<br>`;
    sendMail(mailData, "singhanubhav58@gmail.com", "Form Handler");
    res.render("success");
})

app.post("/register", (req, res) => {
    let {
        username,
        email,
        redirecturl
    } = req.body;
    User.find({
        username: username
    }, (err, docs) => {
        if (docs.length > 0) {
            res.send("failed");
        } else {
            if (redirecturl === "") {
                redirecturl = "https://form-handler.singhanubhav.me/success";
            }
            const newUser = new User({
                username: username,
                email: email,
                redirecturl: redirecturl
            })
            newUser.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render("success", {
                        username
                    });
                }
            })
        }
    })
})

app.get("/form/:user", (req, res) => {
    User.findOne({
        username: req.params.user
    }, (err, docs) => {
        if (docs) {
            res.json({
                status: "success"
            })
        } else {
            res.json({
                status: "failed"
            })
        }
    })
})

app.post("/form/:user", (req, res) => {
    User.findOne({
        username: req.params.user
    }, (err, docs) => {
        if (err) {
            res.send("Error")
        } else {
            const data = Object.entries(req.body);
            let mailData = `Form Submission for ${req.params.user} <br>---------------------------<br>`;
            for (let i = 0; i < data.length; i++) {
                mailData += data[i][0].toUpperCase() + " : " + data[i][1] + "<br>";
            }
            mailData += `---------------------------<br>`;
            sendMail(mailData, docs.email, req.params.user);
            res.redirect(docs.redirecturl);
        }
    })
})

app.listen(3000, () => {
    console.log("On Port 3000!!");
})
