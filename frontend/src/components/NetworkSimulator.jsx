import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Activity, Network, Settings } from 'lucide-react';

const NetworkSimulator = () => {
    const [networkData, setNetworkData] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [autoRun, setAutoRun] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [loading, setLoading] = useState(false);

    // API base URL - adjust for your backend
    const API_BASE = 'http://localhost:3001/api/simulate';

    // Fetch network statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            const result = await response.json();
            if (result.success) {
                setNetworkData(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    // Simulation controls
    const startSimulation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/start`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setIsSimulating(true);
                setAutoRun(true);
            }
        } catch (error) {
            console.error('Failed to start simulation:', error);
        } finally {
            setLoading(false);
        }
    };

    const pauseSimulation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/pause`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setIsSimulating(false);
                setAutoRun(false);
            }
        } catch (error) {
            console.error('Failed to pause simulation:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetSimulation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/reset`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setIsSimulating(false);
                setAutoRun(false);
                await fetchStats();
            }
        } catch (error) {
            console.error('Failed to reset simulation:', error);
        } finally {
            setLoading(false);
        }
    };

    const runTick = async () => {
        try {
            const response = await fetch(`${API_BASE}/tick`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                setNetworkData(result.data);
            }
        } catch (error) {
            console.error('Failed to run tick:', error);
        }
    };

    const advanceTime = async () => {
        try {
            const response = await fetch(`${API_BASE}/advance-time`, { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                await fetchStats();
            }
        } catch (error) {
            console.error('Failed to advance time:', error);
        }
    };

    // Auto-run simulation
    useEffect(() => {
        let interval;
        if (autoRun && isSimulating) {
            interval = setInterval(() => {
                runTick();
            }, 2000); // Run every 2 seconds
        }
        return () => clearInterval(interval);
    }, [autoRun, isSimulating]);

    // Initial data fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Network visualization component
    const NetworkGraph = () => {
        if (!networkData) return <div className="flex items-center justify-center h-64 text-gray-500">Loading network...</div>;

        const nodePositions = {
            A: { x: 100, y: 100 },
            B: { x: 300, y: 100 },
            C: { x: 100, y: 200 },
            D: { x: 300, y: 200 },
            E: { x: 200, y: 300 }
        };

        return (
            <div className="relative bg-gray-900 rounded-lg p-4 h-96 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 350">
                    {/* Links */}
                    {networkData.links.map((link, index) => {
                        const from = nodePositions[link.from];
                        const to = nodePositions[link.to];
                        const utilization = parseFloat(link.utilization);
                        const strokeWidth = Math.max(2, utilization / 10);
                        const strokeColor = link.congested ? '#ef4444' :
                            utilization > 80 ? '#f59e0b' :
                                utilization > 50 ? '#10b981' : '#6b7280';

                        return (
                            <g key={`${link.from}-${link.to}`}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    className="cursor-pointer hover:stroke-blue-400"
                                    onClick={() => setSelectedLink(link)}
                                />
                                {/* Link capacity label */}
                                <text
                                    x={(from.x + to.x) / 2}
                                    y={(from.y + to.y) / 2 - 10}
                                    fill="#9ca3af"
                                    fontSize="10"
                                    textAnchor="middle"
                                    className="pointer-events-none"
                                >
                                    {link.capacity}
                                </text>
                                {/* Queue indicator */}
                                {link.queueSize > 0 && (
                                    <circle
                                        cx={(from.x + to.x) / 2}
                                        cy={(from.y + to.y) / 2 + 15}
                                        r="8"
                                        fill="#ef4444"
                                        className="animate-pulse"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {networkData.nodes.map((node) => {
                        const pos = nodePositions[node.id];
                        const load = node.currentLoad || 0;
                        const radius = Math.max(20, Math.min(35, 20 + load / 5));
                        const fillColor = load > 50 ? '#ef4444' : load > 30 ? '#f59e0b' : '#10b981';

                        return (
                            <g key={node.id}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={radius}
                                    fill={fillColor}
                                    stroke="#374151"
                                    strokeWidth="2"
                                    className="cursor-pointer hover:stroke-blue-400"
                                    onClick={() => setSelectedNode(node)}
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y}
                                    fill="white"
                                    fontSize="14"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    dy="0.35em"
                                    className="pointer-events-none"
                                >
                                    {node.id}
                                </text>
                                {/* Load indicator */}
                                <text
                                    x={pos.x}
                                    y={pos.y + radius + 15}
                                    fill="#9ca3af"
                                    fontSize="10"
                                    textAnchor="middle"
                                    className="pointer-events-none"
                                >
                                    {load} pkt/s
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="absolute top-4 right-4 bg-gray-800 p-3 rounded-lg text-xs">
                    <div className="text-white font-semibold mb-2">Legend</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-300">Normal Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-gray-300">High Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-gray-300">Congested</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Statistics panels
    const StatsPanel = ({ title, children, icon: Icon, className = "" }) => (
        <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Network Traffic Simulator</h1>
                    <p className="text-gray-400">Real-time telecommunication network simulation</p>
                </div>

                {/* Control Panel */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={isSimulating ? pauseSimulation : startSimulation}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                            >
                                {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isSimulating ? 'Pause' : 'Start'}
                            </button>

                            <button
                                onClick={resetSimulation}
                                disabled={loading}
                                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>

                            <button
                                onClick={runTick}
                                disabled={loading || autoRun}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Activity className="w-4 h-4" />
                                Single Tick
                            </button>

                            <button
                                onClick={advanceTime}
                                disabled={loading}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Clock className="w-4 h-4" />
                                Advance Time
                            </button>
                        </div>

                        {networkData && (
                            <div className="flex items-center gap-4 text-sm">
                                <span>Time: {networkData.currentTime}</span>
                                <span>Step: {networkData.simulationStep}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${isSimulating ? 'bg-green-600' : 'bg-gray-600'}`}>
                                    {isSimulating ? 'Running' : 'Stopped'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Network Visualization */}
                    <div className="lg:col-span-2">
                        <StatsPanel title="Network Topology" icon={Network}>
                            <NetworkGraph />
                        </StatsPanel>
                    </div>

                    {/* Statistics Sidebar */}
                    <div className="space-y-6">
                        {/* Network Summary */}
                        {networkData?.summary && (
                            <StatsPanel title="Network Summary" icon={Activity}>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Packets Generated:</span>
                                        <span className="font-mono">{networkData.summary.totalPacketsGenerated}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Packets Transmitted:</span>
                                        <span className="font-mono">{networkData.summary.totalPacketsTransmitted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Packet Loss:</span>
                                        <span className={`font-mono ${parseFloat(networkData.summary.packetLoss) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {networkData.summary.packetLoss}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Avg Queue Size:</span>
                                        <span className="font-mono">{networkData.summary.averageQueueSize.toFixed(2)}</span>
                                    </div>
                                </div>
                            </StatsPanel>
                        )}

                        {/* Node Details */}
                        {selectedNode && (
                            <StatsPanel title={`Node ${selectedNode.id} Details`} icon={Settings}>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Current Load:</span>
                                        <span className="font-mono">{selectedNode.currentLoad} pkt/s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Generated:</span>
                                        <span className="font-mono">{selectedNode.packetsGenerated}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Received:</span>
                                        <span className="font-mono">{selectedNode.packetsReceived}</span>
                                    </div>
                                </div>
                            </StatsPanel>
                        )}

                        {/* Link Details */}
                        {selectedLink && (
                            <StatsPanel title={`Link ${selectedLink.from}→${selectedLink.to} Details`} icon={Network}>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Capacity:</span>
                                        <span className="font-mono">{selectedLink.capacity} pkt/s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Current Load:</span>
                                        <span className="font-mono">{selectedLink.currentLoad} pkt/s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Utilization:</span>
                                        <span className={`font-mono ${parseFloat(selectedLink.utilization) > 80 ? 'text-red-400' : 'text-green-400'}`}>
                                            {selectedLink.utilization}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Queue Size:</span>
                                        <span className={`font-mono ${selectedLink.queueSize > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {selectedLink.queueSize}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Status:</span>
                                        <span className={`font-mono ${selectedLink.congested ? 'text-red-400' : 'text-green-400'}`}>
                                            {selectedLink.congested ? 'Congested' : 'Normal'}
                                        </span>
                                    </div>
                                </div>
                            </StatsPanel>
                        )}

                        {/* Recent Packets */}
                        {networkData?.packets && (
                            <StatsPanel title="Recent Packets" icon={Activity}>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {networkData.packets.slice(-10).map((packet, index) => (
                                        <div key={packet.id} className="text-xs bg-gray-700 rounded p-2">
                                            <div className="flex justify-between">
                                                <span>{packet.source} → {packet.destination}</span>
                                                <span className={packet.transmitted ? 'text-green-400' : 'text-red-400'}>
                                                    {packet.transmitted ? '✓' : '✗'}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 mt-1">
                                                Path: {packet.path.join(' → ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </StatsPanel>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkSimulator;