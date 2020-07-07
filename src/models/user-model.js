const mongoose = require('mongoose')
const validator = require('validator')
const password_validator = require('password-validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const password_validator_schema = new password_validator()

password_validator_schema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().symbols()
    .has().not().spaces()

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) throw Error({ error: 'Not an Email' })
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!password_validator_schema.validate(value)) throw Error({ error: 'Invalid Password' })
        }
    },
    rooms: [{
        room: {
            type: String,
            required: true
        }
    }],
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
}, {
    timestamps: true
})

UserSchema.methods.toJSON = function () {
    const userObject = this.toObject()
    delete userObject.tokens
    return userObject
}

UserSchema.methods.toRemove = function () {
    const userObject = this.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

UserSchema.methods.generateToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET)
    this.tokens = this.tokens.concat({ token })
    await this.save((err) => {
        if (err) throw Error({ error: err.message })
    })
    return token
}

UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await UserModel.findOne({ email })
    if (!user) throw new Error({ error: 'User Does Not Exists!!' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error({ error: 'Wrong Password!!!' })
    return user
}

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, parseInt(process.env.ENCRYPT_PASS))
    }
    next()
})

const UserModel = mongoose.model('User', UserSchema)

module.exports = UserModel