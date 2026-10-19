let ws;
let config = {};
let isRunning = false;

const elements = {
    configForm: document.getElementById('configForm'),
    gateway: document.getElementById('gateway'),
    protocol: document.getElementById('protocol'),
    internalPort: document.getElementById('internalPort'),
    externalPort: document.getElementById('externalPort'),
    lifetime: document.getElementById('lifetime'),
    timeout: document.getElementById('timeout'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    runOnceBtn: document.getElementById('runOnceBtn'),
    statusBadge: document.getElementById('statusBadge'),
    statusText: document.getElementById('statusText'),
    lastRunTime: document.getElementById('lastRunTime'),
    nextRunText: document.getElementById('nextRunText'),
    messageBox: document.getElementById('messageBox'),
    messageText: document.getElementById('messageText'),
    countdownText: document.getElementById('countdownText'),
    progressCircle: document.getElementById('progressCircle'),
    wsStatus: document.getElementById('wsStatus')
};

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        elements.wsStatus.classList.add('connected');
        elements.wsStatus.classList.remove('disconnected');
        elements.wsStatus.querySelector('span:last-child').textContent = 'Connected';
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        elements.wsStatus.classList.remove('connected');
        elements.wsStatus.classList.add('disconnected');
        elements.wsStatus.querySelector('span:last-child').textContent = 'Disconnected';
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
    };
}

function handleWebSocketMessage(message) {
    switch(message.type) {
        case 'init':
            config = message.data.config;
            updateConfigForm();
            if (message.data.status.success !== null) {
                updateStatus(message.data.status);
            }
            updateMonitoringState(message.data.running);
            break;
        case 'status':
            updateStatus(message.data);
            break;
        case 'countdown':
            updateCountdown(message.data);
            break;
        case 'monitoring':
            updateMonitoringState(message.data.running);
            break;
    }
}

function updateConfigForm() {
    elements.gateway.value = config.gateway || '';
    elements.protocol.value = config.protocol || 'tcp';
    elements.internalPort.value = config.internalPort || '';
    elements.externalPort.value = config.externalPort || '';
    elements.lifetime.value = config.lifetime || '3600';
    elements.timeout.value = config.timeout || '30';
}

function updateStatus(status) {
    if (status.success === null) return;
    
    elements.statusBadge.className = 'status-badge ' + (status.success ? 'success' : 'error');
    elements.statusText.textContent = status.success ? 'Success' : 'Error';
    
    elements.progressCircle.classList.toggle('success', status.success);
    elements.progressCircle.classList.toggle('error', !status.success);
    
    if (status.timestamp) {
        const date = new Date(status.timestamp);
        elements.lastRunTime.textContent = date.toLocaleString();
    }
    
    elements.messageText.textContent = status.message || 'No message';
}

function updateCountdown(data) {
    const { remaining, total } = data;
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (remaining > 0) {
        elements.countdownText.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        elements.nextRunText.textContent = `${seconds}s`;
        
        const circumference = 2 * Math.PI * 90;
        const progress = 1 - (remaining / total);
        const offset = circumference * progress;
        elements.progressCircle.style.strokeDashoffset = offset;
    } else {
        elements.countdownText.textContent = '0:00';
        elements.nextRunText.textContent = 'Running...';
        elements.progressCircle.style.strokeDashoffset = 0;
    }
}

function updateMonitoringState(running) {
    isRunning = running;
    elements.startBtn.disabled = running;
    elements.stopBtn.disabled = !running;
    
    if (!running) {
        elements.countdownText.textContent = '--:--';
        elements.nextRunText.textContent = '--';
        elements.progressCircle.style.strokeDashoffset = 0;
    }
}

elements.configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newConfig = {
        gateway: elements.gateway.value,
        protocol: elements.protocol.value,
        internalPort: elements.internalPort.value,
        externalPort: elements.externalPort.value,
        lifetime: elements.lifetime.value,
        timeout: parseInt(elements.timeout.value)
    };
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig)
        });
        
        if (response.ok) {
            config = await response.json();
            alert('Configuration saved successfully!');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        alert('Error saving configuration');
    }
});

elements.startBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/start', { method: 'POST' });
        if (response.ok) {
            console.log('Monitoring started');
        }
    } catch (error) {
        console.error('Error starting monitoring:', error);
    }
});

elements.stopBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/stop', { method: 'POST' });
        if (response.ok) {
            console.log('Monitoring stopped');
        }
    } catch (error) {
        console.error('Error stopping monitoring:', error);
    }
});

elements.runOnceBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/run-once', { method: 'POST' });
        if (response.ok) {
            console.log('Running once');
        }
    } catch (error) {
        console.error('Error running once:', error);
    }
});

async function loadInitialData() {
    try {
        const [configRes, statusRes] = await Promise.all([
            fetch('/api/config'),
            fetch('/api/status')
        ]);
        
        if (configRes.ok) {
            config = await configRes.ok;
            updateConfigForm();
        }
        
        if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.status.success !== null) {
                updateStatus(data.status);
            }
            updateMonitoringState(data.running);
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

connectWebSocket();
loadInitialData();
