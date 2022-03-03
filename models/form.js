const mongoose = require('mongoose');
const formSchema = new mongoose.Schema({
    username: {
        type: String
    },
    formTitle: {
        type: String
    },
    formid: {
        type: String
    },
    redirectUrl: {
        type: String
    }
})
module.exports = mongoose.model('Form', formSchema);