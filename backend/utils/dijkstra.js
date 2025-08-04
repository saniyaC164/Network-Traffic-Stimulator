// utils/dijkstra.js - Dijkstra's shortest path algorithm implementation

function dijkstra(nodes, links, start, end) {
    // Initialize distances and previous nodes
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    // Initialize all distances to infinity except start node
    nodes.forEach(node => {
        distances[node] = node === start ? 0 : Infinity;
        previous[node] = null;
        unvisited.add(node);
    });

    // Create adjacency list from links
    const graph = {};
    nodes.forEach(node => {
        graph[node] = [];
    });

    links.forEach(link => {
        // Add both directions for undirected graph
        graph[link.from].push({ node: link.to, weight: 1 });
        graph[link.to].push({ node: link.from, weight: 1 });
    });

    while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let currentNode = null;
        let minDistance = Infinity;

        for (const node of unvisited) {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                currentNode = node;
            }
        }

        // If no reachable unvisited nodes, break
        if (currentNode === null || distances[currentNode] === Infinity) {
            break;
        }

        // Remove current node from unvisited
        unvisited.delete(currentNode);

        // If we reached the destination, we can stop
        if (currentNode === end) {
            break;
        }

        // Update distances to neighbors
        if (graph[currentNode]) {
            graph[currentNode].forEach(neighbor => {
                if (unvisited.has(neighbor.node)) {
                    const newDistance = distances[currentNode] + neighbor.weight;
                    if (newDistance < distances[neighbor.node]) {
                        distances[neighbor.node] = newDistance;
                        previous[neighbor.node] = currentNode;
                    }
                }
            });
        }
    }

    // Reconstruct path
    const path = [];
    let currentNode = end;

    while (currentNode !== null) {
        path.unshift(currentNode);
        currentNode = previous[currentNode];
    }

    // Return empty array if no path found
    if (path[0] !== start) {
        return [];
    }

    return path;
}

module.exports = { dijkstra };