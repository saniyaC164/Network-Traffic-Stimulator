// network.js - Improved Network Traffic Simulator
const { dijkstra } = require('./utils/dijkstra');

const nodes = ['A', 'B', 'C', 'D', 'E'];

// Multiple time slots as shown in assignment sample data
const trafficRates = {
    '08:00': { A: 50, B: 30, C: 40, D: 20, E: 60 },
    '08:15': { A: 55, B: 35, C: 45, D: 25, E: 65 },
    '08:30': { A: 60, B: 40, C: 50, D: 30, E: 70 },
    '08:45': { A: 55, B: 35, C: 45, D: 25, E: 65 }
};

const links = [
    { from: 'A', to: 'B', capacity: 100 },
    { from: 'A', to: 'C', capacity: 80 },
    { from: 'B', to: 'D', capacity: 70 },
    { from: 'C', to: 'D', capacity: 90 },
    { from: 'C', to: 'E', capacity: 100 },
    { from: 'D', to: 'E', capacity: 60 }
];

let networkState = {
    currentTime: '08:00',
    isRunning: false,
    simulationStep: 0,
    queues: {},
    linkLoads: {},
    packetStats: [],
    nodeStats: {},
    totalPacketsGenerated: 0,
    totalPacketsTransmitted: 0
};

// Initialize network state
function initializeNetwork() {
    networkState.queues = {};
    networkState.linkLoads = {};
    networkState.nodeStats = {};

    // Initialize node statistics
    nodes.forEach(node => {
        networkState.nodeStats[node] = {
            packetsGenerated: 0,
            packetsReceived: 0,
            currentLoad: 0
        };
    });

    // Initialize link loads
    links.forEach(link => {
        const linkKey = `${link.from}-${link.to}`;
        networkState.linkLoads[linkKey] = 0;
        networkState.queues[linkKey] = 0;
    });
}

// Get random destination different from source
function getRandomDestination(source) {
    const availableNodes = nodes.filter(n => n !== source);
    return availableNodes[Math.floor(Math.random() * availableNodes.length)];
}

// Process queued packets from previous ticks
function processQueuedPackets() {
    Object.keys(networkState.queues).forEach(linkKey => {
        if (networkState.queues[linkKey] > 0) {
            const link = links.find(l => `${l.from}-${l.to}` === linkKey);
            if (link) {
                const processable = Math.min(networkState.queues[linkKey], link.capacity);
                networkState.queues[linkKey] -= processable;
                networkState.totalPacketsTransmitted += processable;
            }
        }
    });
}

// Calculate link utilization and handle congestion
function updateLinkLoad(linkKey, packets) {
    const link = links.find(l => `${l.from}-${l.to}` === linkKey);
    if (!link) return false;

    const currentLoad = networkState.linkLoads[linkKey] || 0;
    const newLoad = currentLoad + packets;

    if (newLoad > link.capacity) {
        // Congestion: queue excess packets
        const excess = newLoad - link.capacity;
        networkState.queues[linkKey] = (networkState.queues[linkKey] || 0) + excess;
        networkState.linkLoads[linkKey] = link.capacity;
        return false; // Indicates congestion
    } else {
        networkState.linkLoads[linkKey] = newLoad;
        return true; // No congestion
    }
}

// Main simulation step
function simulateTick() {
    const currentRates = trafficRates[networkState.currentTime];
    if (!currentRates) return;

    // Reset current tick data
    networkState.linkLoads = {};
    networkState.packetStats = [];
    let tickPacketsGenerated = 0;

    // Process queued packets from previous ticks first
    processQueuedPackets();

    // Generate new traffic for each node
    Object.entries(currentRates).forEach(([source, rate]) => {
        networkState.nodeStats[source].packetsGenerated += rate;
        networkState.nodeStats[source].currentLoad = rate;
        tickPacketsGenerated += rate;

        // Generate packets from this source
        for (let i = 0; i < rate; i++) {
            const destination = getRandomDestination(source);
            const path = dijkstra(nodes, links, source, destination);

            if (path.length < 2) continue;

            let packetTransmitted = true;
            const packetRoute = [];

            // Simulate packet transmission through each link in path
            for (let j = 0; j < path.length - 1; j++) {
                const from = path[j];
                const to = path[j + 1];
                const linkKey = `${from}-${to}`;

                // Check if link can handle this packet
                const transmitted = updateLinkLoad(linkKey, 1);
                packetRoute.push({ from, to, transmitted, linkKey });

                if (!transmitted) {
                    packetTransmitted = false;
                }
            }

            // Record packet statistics
            networkState.packetStats.push({
                id: `${source}-${destination}-${i}`,
                source,
                destination,
                path,
                route: packetRoute,
                transmitted: packetTransmitted,
                timestamp: networkState.simulationStep
            });

            if (packetTransmitted) {
                networkState.nodeStats[destination].packetsReceived += 1;
                networkState.totalPacketsTransmitted += 1;
            }
        }
    });

    networkState.totalPacketsGenerated += tickPacketsGenerated;
    networkState.simulationStep += 1;
}

// Get comprehensive network statistics
function getNetworkStats() {
    const linkStats = links.map(link => {
        const linkKey = `${link.from}-${link.to}`;
        const currentLoad = networkState.linkLoads[linkKey] || 0;
        const queueSize = networkState.queues[linkKey] || 0;

        return {
            from: link.from,
            to: link.to,
            capacity: link.capacity,
            currentLoad,
            utilization: (currentLoad / link.capacity * 100).toFixed(2),
            queueSize,
            congested: currentLoad >= link.capacity || queueSize > 0
        };
    });

    return {
        currentTime: networkState.currentTime,
        simulationStep: networkState.simulationStep,
        isRunning: networkState.isRunning,
        nodes: nodes.map(node => ({
            id: node,
            ...networkState.nodeStats[node]
        })),
        links: linkStats,
        packets: networkState.packetStats,
        summary: {
            totalPacketsGenerated: networkState.totalPacketsGenerated,
            totalPacketsTransmitted: networkState.totalPacketsTransmitted,
            packetLoss: networkState.totalPacketsGenerated > 0
                ? ((networkState.totalPacketsGenerated - networkState.totalPacketsTransmitted) / networkState.totalPacketsGenerated * 100).toFixed(2)
                : 0,
            averageQueueSize: Object.values(networkState.queues).reduce((a, b) => a + b, 0) / links.length
        }
    };
}

// Simulation control functions
function startSimulation() {
    networkState.isRunning = true;
    initializeNetwork();
}

function pauseSimulation() {
    networkState.isRunning = false;
}

function resetSimulation() {
    networkState.isRunning = false;
    networkState.simulationStep = 0;
    networkState.currentTime = '08:00';
    networkState.totalPacketsGenerated = 0;
    networkState.totalPacketsTransmitted = 0;
    initializeNetwork();
}

// Update traffic generation rates (for dynamic control)
function updateTrafficRates(nodeId, newRate) {
    if (nodes.includes(nodeId) && trafficRates[networkState.currentTime]) {
        trafficRates[networkState.currentTime][nodeId] = newRate;
        return true;
    }
    return false;
}

// Update link capacity (for dynamic control)
function updateLinkCapacity(from, to, newCapacity) {
    const link = links.find(l => l.from === from && l.to === to);
    if (link) {
        link.capacity = newCapacity;
        return true;
    }
    return false;
}

// Advance to next time slot
function advanceTimeSlot() {
    const timeSlots = Object.keys(trafficRates);
    const currentIndex = timeSlots.indexOf(networkState.currentTime);
    if (currentIndex < timeSlots.length - 1) {
        networkState.currentTime = timeSlots[currentIndex + 1];
    }
}

module.exports = {
    simulateTick,
    getNetworkStats,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateTrafficRates,
    updateLinkCapacity,
    advanceTimeSlot,
    initializeNetwork
};