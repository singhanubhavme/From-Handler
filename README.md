# From-Handler
## Use this web app on https://formhandler.xyz

This is a web app that can be connected with your static website to get the form data on your email. This can save you lot of money, because even for adding a contact form on your static portfolio website you need to create a backend server to fetch your form data.

---
## How to use this app?

Just follow the steps on the website https://formhandler.xyz/how-to-use/

---

## Requirements

For development, you will only need Node.js and a node package manager(npm), and mongodb installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v16.13.2

    $ npm --version
    8.1.2

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

### MongoDB
- #### MongoDB installation on Windows

  Just go on [official MongoDB website](https://www.mongodb.com/try/download/community) and download the installer.

---

## Install

    $ git clone https://github.com/singhanubhavme/From-Handler.git
    $ cd From-Handler
    $ npm install && npm i nodemon -g

## Configure app

Create a `.env` file inside the `Form-Handler` directory, and add following lines to the file.

~~~~
DB_URL=mongodb://localhost:27017/form-handler
EMAIL=YOUR EMAIL
EMAIL_PASS=PASSWORD OF YOUR EMAIL
SECRET=ANYTHING
PORT=ANY PORT YOU WANT TO USE
~~~~

---

## Running the app

    $ npm start
