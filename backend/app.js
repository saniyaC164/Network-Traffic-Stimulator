const express = require('express');
const cors = require('cors');
//const { getNetworkStats, simulateTick } = require('./network');
const simulateRouter = require('./routes/simulate');
const app = express();
app.use(cors());

app.use('/simulate', simulateRouter);
//setInterval(simulateTick, 5000); // Simulate every 5 seconds

/*app.get('/simulate', (req, res) => {
    res.json(getNetworkStats());
});*/

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));

