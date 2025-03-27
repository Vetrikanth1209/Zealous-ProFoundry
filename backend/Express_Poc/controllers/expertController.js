const express = require('express');
const Expert = require('../models/Expert');

const router = express.Router();

// CREATE EXPERT
router.post('/add_expert', async (req, res) => {
    try {
        const { mod_expert_name, mod_expert_mobile, mod_expert_role, mod_expert_profile } = req.body;

        if (!mod_expert_name || !mod_expert_mobile || !mod_expert_role || !mod_expert_profile) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const expert = new Expert(req.body);
        await expert.save();
        res.status(201).json(expert);
    } catch (error) {   
        res.status(400).json({ error: error.message });
    }
});

// GET EXPERT
router.get('/read_all_experts', async (req, res) => {
    try {
        const experts = await Expert.find();
        res.json(experts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET EXPERT by mod_expert_id
router.get('/get_expert/:mod_expert_id', async (req, res) => {
    try {
        const expert = await Expert.findOne({ mod_expert_id: req.params.mod_expert_id });

        if (!expert) return res.status(404).json({ error: 'Expert not found' });

        res.json(expert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Expert by mod_expert_id
router.put('/update_expert/:mod_expert_id', async (req, res) => {
    try {
        const updatedExpert = await Expert.findOneAndUpdate(
            { mod_expert_id: req.params.mod_expert_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedExpert) return res.status(404).json({ error: 'Expert not found' });

        res.json(updatedExpert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update poc_id separately by mod_expert_id 
router.put('/update_poc/:mod_expert_id', async (req, res) => {
    try {
        const { poc_id } = req.body;

        if (!poc_id || !Array.isArray(poc_id)) {
            return res.status(400).json({ error: 'poc_id must be an array' });
        }

        const updatedExpert = await Expert.findOneAndUpdate(
            { mod_expert_id: req.params.mod_expert_id },
            { $addToSet: { poc_id: { $each: poc_id } } }, // Add new unique values
            { new: true, runValidators: true }
        );

        if (!updatedExpert) return res.status(404).json({ error: 'Expert not found' });

        res.json(updatedExpert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update mod_id separately by mod_expert_id 
router.put('/update_mod/:mod_expert_id', async (req, res) => {
    try {
        const { mod_id } = req.body;

        if (!mod_id || !Array.isArray(mod_id)) {
            return res.status(400).json({ error: 'mod_id must be an array' });
        }

        const updatedExpert = await Expert.findOneAndUpdate(
            { mod_expert_id: req.params.mod_expert_id },
            { $addToSet: { mod_id: { $each: mod_id } } }, // Add new unique values
            { new: true, runValidators: true }
        );

        if (!updatedExpert) return res.status(404).json({ error: 'Expert not found' });

        res.json(updatedExpert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete an Expert by mod_expert_id
router.delete('/delete_expert/:mod_expert_id', async (req, res) => {
    try {
        const deletedExpert = await Expert.findOneAndDelete({ mod_expert_id: req.params.mod_expert_id });

        if (!deletedExpert) return res.status(404).json({ error: 'Expert not found' });

        res.json({ message: 'Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Expert Name by mod_id
router.get('/get_expert_name/:mod_id', async (req, res) => {
    try {
        const expert = await Expert.findOne({ mod_id: req.params.mod_id });

        if (!expert) return res.status(404).json({ error: 'Expert not found' });

        res.json({mod_expert_name:expert.mod_expert_name});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;