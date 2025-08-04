// routes/simulate.js
const express = require('express');
const router = express.Router();
const { simulateTick, getNetworkStats } = require('../network');

router.get('/', (req, res) => {
    simulateTick(); // simulate on each call (or make it time-based)
    res.json(getNetworkStats());
});

module.exports = router;
