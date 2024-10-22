let temperatureData = [];
let co2Data = [];

// Function to fetch sensor data from the server
function fetchSensorData() {
    fetch('/api/sensorData')  // Ensure that your server has the correct route setup
        .then(response => { 
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Update temperature and CO2 values in the UI
            document.getElementById('temperature').innerText = data.temperature || 'N/A';
            document.getElementById('co2').innerText = data.co2 || 'N/A';

            // Add data to the chart
            addData(chart, new Date().toLocaleTimeString(), data.temperature, data.co2);
        })
        .catch(error => console.error('Error fetching sensor data:', error));
}

// Control the light (on/off) using the API
function controlLight(state) {
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'light', state: state })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(`Light turned ${state}`);
        }
    })
    .catch(error => console.error('Error controlling light:', error));
}

// Event listeners for the light control buttons
document.getElementById('lightOn').addEventListener('click', () => controlLight('on'));
document.getElementById('lightOff').addEventListener('click', () => controlLight('off'));

// Fetch sensor data every 5 seconds
setInterval(fetchSensorData, 5000);

// Initialize Chart.js for real-time data visualization
const ctx = document.getElementById('sensorChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],  // Time labels
        datasets: [
            {
                label: 'Temperature (°C)',
                data: temperatureData,
                borderColor: 'red',
                fill: false,
            },
            {
                label: 'CO2 Level (ppm)',
                data: co2Data,
                borderColor: 'blue',
                fill: false,
            }
        ]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Value'
                }
            }
        }
    }
});

// Function to add new data to the chart
function addData(chart, label, temp, co2) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(temp);
    chart.data.datasets[1].data.push(co2);
    chart.update();
}

// Populate device list dropdown
const devices = ['Device XYZ', 'Device ABC', 'Device 123', 'Device 234'];

function populateDeviceList() {
    const deviceListElement = document.getElementById('deviceList');
    deviceListElement.innerHTML = '';

    devices.forEach(device => {
        const li = document.createElement('li');
        li.className = 'device';
        li.innerText = device;
        li.onclick = () => selectDevice(device);
        deviceListElement.appendChild(li);
    });
}

// Filter devices in dropdown
function filterDevices() {
    const input = document.getElementById('deviceSearch');
    const filter = input.value.toLowerCase();
    const deviceItems = document.querySelectorAll('#deviceList li');

    let hasVisibleItems = false;
    deviceItems.forEach(item => {
        const textValue = item.textContent || item.innerText;
        if (textValue.toLowerCase().includes(filter)) {
            item.style.display = '';
            hasVisibleItems = true;
        } else {
            item.style.display = 'none';
        }
    });

    const dropdown = document.querySelector('.dropdown');
    dropdown.style.display = hasVisibleItems ? 'block' : 'none';
}

// Select a device from the dropdown
function selectDevice(device) {
    alert('Selected Device: ' + device);
    document.getElementById('deviceSearch').value = device;
    document.querySelector('.dropdown').style.display = 'none';
    document.getElementById('controlButtons').style.display = 'block';
}

// Initialize device list on page load
window.onload = populateDeviceList;

// Turn on/off device control buttons
document.getElementById('turnOn').addEventListener('click', function() {
    const device = document.getElementById('deviceSearch').value;
    document.getElementById('feedbackMessage').innerText = device + ' is turned ON';
    document.getElementById('feedbackMessage').style.display = 'block';
    // Add your logic to turn on the device here
});

document.getElementById('turnOff').addEventListener('click', function() {
    const device = document.getElementById('deviceSearch').value;
    document.getElementById('feedbackMessage').innerText = device + ' is turned OFF';
    document.getElementById('feedbackMessage').style.display = 'block';
    // Add your logic to turn off the device here
});

// WebSocket connection to receive real-time updates from Arduino
const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = function(event) {
    const sensorValue = event.data;
    console.log('Received data from Arduino:', sensorValue);
    // Update the chart/UI with new data here if needed
};
