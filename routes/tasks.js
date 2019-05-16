// routes/tasks.js

const express = require('express');
const multer = require('multer'); // for file uploads
const sharp = require('sharp'); // for handling image files
const Task = require('./../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// CREATE
router.post('/tasks', auth, async function(req, res) {
    const task = new Task({
        description: req.body.description,
        complete: req.body.complete,
        owner: req.user._id
    })
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// GET /tasks?complete=false <-- show only the not complete tasks
// GET /tasks?limit=10&skip=10 <-- skips first ten results
// GET /tasks?sortBy=createdAt:asc or createdAt:desc
// READ ALL
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    console.log(req.query);
    if (req.query.complete) {
        match.complete = req.query.complete === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        // let tasks = await Task.find({}); // finds all
        // let tasks = await Task.find({ owner: req.user._id, complete: match }); 
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort 
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

// READ ONE
router.get('/tasks/:id', auth, async function(req, res) {
    var _id = req.params.id;
    try {
        let task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) 
            res.status(404).send();

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// DELETE ONE
router.delete('/tasks/:id', auth, async function(req, res) {
    let _id = req.params.id;
    try {
        let task = await Task.findByIdAndDelete({ _id, owner: req.user._id});
        if (!task)
            res.status(404).send();

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// UPDATE
router.patch('/tasks/:id', auth, async function(req, res) {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'complete'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' });
    }
    let _id = req.params.id;
    try {
        const task = await Task.findById({ _id, owner: req.user._id });

        if (!task)
            return res.status(404).send();

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// add photo to task
const upload = multer({
    limits: {
        fileSize: 2000000,  // <-- limit to 2 MB
    },
    fileFilter(req, file, callback) {
        let temp = file.originalname.toLowerCase();
        if (!temp.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('File must be an image file.'));
        }
        if (file.fileSize > 2000000)
            return callback(new Error('File must be under 2 MB in size.'));

        callback(undefined, true); // passed
    }
});

router.post('/tasks/photo/:id', auth, upload.single('photo'), async function(req, res) {
    const buffer = await sharp(req.file.buffer)
        .resize({ width: 100, height: 100 })
        .png()
        .toBuffer();
    var _id = req.params.id;
    try {
        let task = await Task.findOne({ _id, owner: req.user._id });
        task.photo = buffer;
        console.log(task);
        await task.save();
        res.send();
    } catch (e) {

    }
}, (error, req, res, next) => {
    res.status(400).send({ error:error.message })
});

router.get('/tasks/photo/:id', async function(req, res) {
    try {
        let task = await Task.findById(req.params.id);
        if (!task)
            throw new Error();
        res.set('Content-Type', 'image/png');
        res.send(task.photo);
    } catch (e) {
        res.status(500).send(e);
    }
});

// delete photo from task
router.delete('/tasks/photo/:id', async function(req, res) {
    try {
        let task = await Task.findById(req.params.id);
        if (!task)
            throw new Error();
        task.photo = undefined;
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(404).send(e);
    }
})

module.exports = router;