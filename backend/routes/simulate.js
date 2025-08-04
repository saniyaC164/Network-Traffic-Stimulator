// routes/simulate.js - Enhanced API routes
const express = require('express');
const router = express.Router();
const {
    simulateTick,
    getNetworkStats,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateTrafficRates,
    updateLinkCapacity,
    advanceTimeSlot
} = require('../network');

// Get current network statistics
router.get('/stats', (req, res) => {
    try {
        const stats = getNetworkStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Run single simulation tick
router.post('/tick', (req, res) => {
    try {
        simulateTick();
        const stats = getNetworkStats();
        res.json({
            success: true,
            message: 'Simulation tick completed',
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start continuous simulation
router.post('/start', (req, res) => {
    try {
        startSimulation();
        res.json({
            success: true,
            message: 'Simulation started'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Pause simulation
router.post('/pause', (req, res) => {
    try {
        pauseSimulation();
        res.json({
            success: true,
            message: 'Simulation paused'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reset simulation to initial state
router.post('/reset', (req, res) => {
    try {
        resetSimulation();
        res.json({
            success: true,
            message: 'Simulation reset to initial state'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update traffic generation rate for a specific node
router.post('/traffic/:nodeId', (req, res) => {
    try {
        const { nodeId } = req.params;
        const { rate } = req.body;

        if (!rate || rate < 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid rate (>= 0) is required'
            });
        }

        const updated = updateTrafficRates(nodeId, parseInt(rate));

        if (updated) {
            res.json({
                success: true,
                message: `Traffic rate updated for node ${nodeId} to ${rate} packets/second`
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Node ${nodeId} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update link capacity
router.post('/link/:from/:to/capacity', (req, res) => {
    try {
        const { from, to } = req.params;
        const { capacity } = req.body;

        if (!capacity || capacity <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid capacity (> 0) is required'
            });
        }

        const updated = updateLinkCapacity(from, to, parseInt(capacity));

        if (updated) {
            res.json({
                success: true,
                message: `Link capacity updated from ${from} to ${to}: ${capacity} packets/second`
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Link from ${from} to ${to} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Advance to next time slot
router.post('/advance-time', (req, res) => {
    try {
        advanceTimeSlot();
        const stats = getNetworkStats();
        res.json({
            success: true,
            message: `Advanced to time slot: ${stats.currentTime}`,
            data: { currentTime: stats.currentTime }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get network topology (for frontend visualization)
router.get('/topology', (req, res) => {
    try {
        const stats = getNetworkStats();
        res.json({
            success: true,
            data: {
                nodes: stats.nodes.map(node => ({
                    id: node.id,
                    label: node.id
                })),
                links: stats.links.map(link => ({
                    source: link.from,
                    target: link.to,
                    capacity: link.capacity
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;