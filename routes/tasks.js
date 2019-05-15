// routes/tasks.js

const express = require('express');
const Task = require('./../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// CREATE
router.post('/tasks', auth, async function(req, res) {
    // const task = new Task(req.body);
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

module.exports = router;