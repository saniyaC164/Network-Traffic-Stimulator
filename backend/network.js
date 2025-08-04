// network.js
const { dijkstra } = require('./utils/dijkstra');

const nodes = ['A', 'B', 'C', 'D', 'E'];

const trafficRates = {
    '08:00': { A: 50, B: 30, C: 40, D: 20, E: 60 },
};

const links = [
    { from: 'A', to: 'B', capacity: 100 },
    { from: 'A', to: 'C', capacity: 80 },
    { from: 'B', to: 'D', capacity: 70 },
    { from: 'C', to: 'D', capacity: 90 },
    { from: 'C', to: 'E', capacity: 100 },
    { from: 'D', to: 'E', capacity: 60 },
];

let networkState = {
    time: '08:00',
    queues: {},   // Example: { 'A-B': 12 }
    stats: [],    // Stores all packets info per tick
};

// Helper to get a random destination ≠ source
function getRandomDestination(source) {
    return nodes.filter(n => n !== source)[Math.floor(Math.random() * (nodes.length - 1))];
}

// Increments queue for a congested link
function queuePacket(linkKey) {
    if (!networkState.queues[linkKey]) {
        networkState.queues[linkKey] = 0;
    }
    networkState.queues[linkKey] += 1;
}

// Tracks current load on links during this tick
let linkUsage = {};

// Core simulation per 5-second tick
function simulateTick() {
    const rates = trafficRates[networkState.time];
    networkState.stats = [];
    linkUsage = {};

    for (const source of Object.keys(rates)) {
        const packets = rates[source];

        for (let i = 0; i < packets; i++) {
            const destination = getRandomDestination(source);
            const path = dijkstra(nodes, links, source, destination);

            if (path.length < 2) continue; // Skip if no valid route

            // Simulate each link in the path
            for (let j = 0; j < path.length - 1; j++) {
                const from = path[j];
                const to = path[j + 1];
                const key = `${from}-${to}`;

                linkUsage[key] = (linkUsage[key] || 0) + 1;

                const link = links.find(l => l.from === from && l.to === to);
                if (link && linkUsage[key] > link.capacity) {
                    queuePacket(key); // Overloaded, add to queue
                }
            }

            // Save successful packet route
            networkState.stats.push({ from: source, to: destination, path });
        }
    }
}

function getNetworkStats() {
    return {
        time: networkState.time,
        stats: networkState.stats,
        queues: networkState.queues,
        links,
    };
}

module.exports = { simulateTick, getNetworkStats };
