// src/App.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [networkData, setNetworkData] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      axios.get('http://localhost:5000/simulate')
        .then(res => setNetworkData(res.data))
        .catch(err => console.error("Error fetching network data:", err));
    };

    fetchData(); // Initial
    const interval = setInterval(fetchData, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!networkData) return <div>Loading simulation...</div>;

  const { time, stats, queues, links } = networkData;

  return (
    <div className="container">
      <h1>Network Traffic Simulator</h1>
      <p><strong>Simulation Time:</strong> {time}</p>

      <section className="section">
        <h2>Packet Routes</h2>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((packet, idx) => (
              <tr key={idx}>
                <td>{packet.from}</td>
                <td>{packet.to}</td>
                <td>{packet.path.join(' → ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>Link Congestion (Queues)</h2>
        {Object.keys(queues).length === 0 ? (
          <p>No congestion detected.</p>
        ) : (
          <ul>
            {Object.entries(queues).map(([link, count], idx) => (
              <li key={idx}><strong>{link}</strong>: {count} packets queued</li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <h2>Link Info</h2>
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Capacity</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, idx) => (
              <tr key={idx}>
                <td>{link.from}</td>
                <td>{link.to}</td>
                <td>{link.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
