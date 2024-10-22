const express = require('express');
const { SerialPort } = require('serialport');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000; // HTTP server port
const SERIAL_PORT_PATH = 'COM3'; // Adjust this to your actual port

// Create a serial port instance
const port = new SerialPort({
    path: SERIAL_PORT_PATH,
    baudRate: 9600,
    autoOpen: false // Prevent auto-opening
});

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Variables to store the latest sensor data
let latestTemperature = 0;
let latestCO2 = 0;

// Set up the WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

port.open((err) => {
    if (err) {
        return console.log('Error opening port: ', err.message);
    }

    wss.on('connection', (ws) => {
        console.log('Client connected');

        // Listen for data from the Arduino via the serial port
        port.on('data', (data) => {
            const sensorValue = data.toString().trim();
            console.log('Data from Arduino:', sensorValue);

            // Assuming the sensor data is formatted as 'temperature,co2'
            const [temperature, co2] = sensorValue.split(',');
            latestTemperature = parseFloat(temperature) || 0;
            latestCO2 = parseFloat(co2) || 0;

            // Send the data to connected WebSocket clients
            ws.send(JSON.stringify({ temperature: latestTemperature, co2: latestCO2 }));
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
});

// API route to fetch the latest sensor data
app.get('/api/sensorData', (req, res) => {
    res.json({
        temperature: latestTemperature,
        co2: latestCO2
    });
});

// API route to control the device (e.g., light on/off)
app.post('/api/control', (req, res) => {
    const { action, state } = req.body;

    if (action === 'light' && (state === 'on' || state === 'off')) {
        console.log(`Turning ${state} the light`);
        // Add the code to send commands to the Arduino here (if needed)
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Start the HTTP server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
