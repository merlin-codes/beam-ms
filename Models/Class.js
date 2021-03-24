const mongoose = require('mongoose');
// let code_raw = Math.random().toString(16).substr(2, 8)
const Class = mongoose.Schema(
    {
        name: String,
        code: String,
        teacher: Object,
        students: [...Object]
    }
)

module.exports = mongoose.model('Classes')