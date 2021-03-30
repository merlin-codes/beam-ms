const mongoose = require('mongoose');
// let code_raw = Math.random().toString(16).substr(2, 8)
const Class = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        code: {
            type: String,
            require: true
        },
        teacher: {
            type: Object,
            required: true
        },
        students: {
            type: Array,
            required: false
        },
        avg: {
            type: Number,
            required: false
        }
    }
)

module.exports = mongoose.model('Classes', Class)