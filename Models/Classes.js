const mongoose = require('mongoose');
// let code_raw = Math.random().toString(16).substr(2, 8)
const Class = mongoose.Schema(
    {
        name: String,
        teacher: Object,
        students: Array,
        avg: Number
    }
)

module.exports = mongoose.model('Classes', Class)