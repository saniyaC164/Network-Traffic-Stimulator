This application simulates how data packets flow through a telecommunication network - like the internet, corporate networks, or mobile networks. It helps understand network behavior, congestion, and performance.
Key Concepts
1. Network Topology

Nodes (A, B, C, D, E): These represent network devices like routers, switches, or computers
Links: The connections between nodes (like cables, fiber optics, or wireless connections)
Capacity: How much data each link can handle (e.g., 100 packets per second)

2. Traffic Generation

Each node generates data packets at different rates
Time slots (08:00, 08:15, 08:30, 08:45) represent different periods with varying traffic loads
Real networks have peak hours (morning rush, evening) vs quiet times (night)

3. Packet Routing

When a packet needs to go from Node A to Node E, it must find a path
Uses Dijkstra's algorithm to find the shortest path
Example: A→C→E or A→B→D→E



To run the project 
clone it to your local repository 



To run backend 
cd backend 
npm install 
npm start



To run frontend
cd frontend
npm install 
npm run dev 