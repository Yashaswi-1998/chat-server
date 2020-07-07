const mongoose = require('mongoose')
const connectionURL=process.env.MONGODB_URL

mongoose.connect(connectionURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('DB Connected!!!')
}).catch((e) => {
    console.log('DB Not Connected!!!')
})

module.exports = mongoose