// routes/users.js

const express = require('express');
const multer = require('multer'); // for file uploads
const sharp = require('sharp'); // for handling image files
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

// REGISTER (CREATE)
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    console.log(user);
    try {
        // await user.save();
        const token = await user.generateAuthToken();
        // sendWelcomeEmail(user.email, user.name) // disabled so i don't get a whole bunch of email messages
        console.log('user saved!');
        res.status(201).send( { user, token });
    } catch (e) {
        console.log('user NOT saved');
        res.status(400).send(e);
    }
});

// READ OWN PROFILE
router.get('/users/me', auth, async function(req, res) {
    res.send(req.user);
});

// DELETE LOGGED IN USER
router.delete('/users/me', auth, async function(req, res) {
    try {        
        await req.user.remove();
        sendCancelEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
})

// UPDATE PROFILE
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' });
    }
    try {
        const user = req.user;
        updates.forEach((update) => user[update] = req.body[update]);

        await user.save();
        res.send(user);
    } catch (e) {
        res.status(500).send(e);
    }
});

// LOGIN
router.post('/users/login', async function(req, res) {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send( { user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

// LOGOUT
router.post('/users/logout', auth, async function(req, res) {
    try {
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

// LOGOUT ALL
router.post('/users/logoutall', auth, async function (req, res) {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

// upload profile photo
const upload = multer({ 
    limits: {
        fileSize: 2000000,   // <-- limit to 2 MB
    },
    fileFilter(req, file, callback) {
        let temp = file.originalname.toLowerCase();
        if (!temp.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('File must be an image file.')); // if an error
        }
        if (file.fileSize > 2000000)
            return callback(new Error('File must be under 2 MB in size.'));

        callback(undefined, true); // if it passes
        // callback(undefined, false); // if it don't pass
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async function(req, res) {
    const buffer = await sharp(req.file.buffer)
        .resize( { width: 200, height: 300 })
        .png()
        .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error:error.message});
});

// delete profile pic
router.delete('/users/me/avatar', auth, async function(req, res) {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/:id/avatar', async function(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png'); // set the image type
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
})

module.exports = router;