// models/user.js

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid.');
            }
        }
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number.');
            }
        },
        required: false,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    },
    password: {
        type: String,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase() === 'password')
                throw new Error('Password cannot be "password".');
        },
        required: true,
    }
}, {
    timestamps: true
});

// middleware - find user's email for logging in
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) 
        throw new Error('That email address does not exist.');

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) 
        throw new Error('Incorrect password.');

    return user;
}

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;
    return userObj;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET);
    user.tokens = user.tokens.concat({token: token});
    await user.save();
    return token;
}

// middleware - hash the plain text password
userSchema.pre('save', async function hashPassword() {
    let user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    console.log('just before saving');
});

// delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany( { owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
