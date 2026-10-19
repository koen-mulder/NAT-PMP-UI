# NAT-PMP Monitor

A Docker-based web application for monitoring and managing NAT-PMP (Network Address Translation Port Mapping Protocol) client operations with real-time status updates and a beautiful web interface.

## Features

- 🌐 **Web Interface**: Configure NAT-PMP parameters through an intuitive web UI
- 🔄 **Automated Monitoring**: Runs natpmpc continuously with configurable intervals
- ✅ **Status Tracking**: Visual feedback with green (success) and red (error) indicators
- ⏱️ **Countdown Timer**: Shows time remaining until next run with a circular progress indicator
- 📊 **Real-time Updates**: WebSocket-based live status updates
- 🐳 **Docker Support**: Easy deployment with Docker and Docker Compose

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

Then open your browser to `http://localhost:3000`

### Using Docker

```bash
docker build -t natpmpc-monitor .
docker run -d -p 3000:3000 --network host natpmpc-monitor
```

### Local Development

```bash
npm install
npm start
```

## Configuration

The web interface allows you to configure the following parameters:

- **Gateway IP**: The IP address of your NAT gateway/router
- **Protocol**: TCP or UDP
- **Internal Port**: The port on your local machine
- **External Port**: The desired external port
- **Mapping Lifetime**: How long the port mapping should last (in seconds)
- **Run Interval**: Time between each natpmpc execution (in seconds)

## How to Use

1. **Configure Parameters**:
   - Enter your gateway IP address
   - Set the internal and external ports
   - Choose the protocol (TCP/UDP)
   - Set the mapping lifetime and run interval
   - Click "Save Configuration"

2. **Start Monitoring**:
   - Click "Start Monitoring" to begin automatic execution
   - The countdown timer will show time until the next run
   - Status updates appear in real-time

3. **Monitor Status**:
   - **Green badge**: Last run was successful
   - **Red badge**: Last run had an error
   - Error messages are displayed in the message box
   - Circular progress indicator shows countdown to next run

4. **Control Options**:
   - **Start Monitoring**: Begin automatic periodic execution
   - **Stop Monitoring**: Stop automatic execution
   - **Run Once**: Execute natpmpc immediately without starting monitoring

## API Endpoints

- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration
- `GET /api/status` - Get current status
- `POST /api/start` - Start monitoring
- `POST /api/stop` - Stop monitoring
- `POST /api/run-once` - Run natpmpc once

## WebSocket Events

The application uses WebSocket for real-time updates:

- `init` - Initial state when connecting
- `status` - Status update after each run
- `countdown` - Countdown timer updates
- `monitoring` - Monitoring state changes

## Requirements

- Docker and Docker Compose (for containerized deployment)
- Node.js 18+ (for local development)
- libnatpmp and natpmpc

## Network Configuration

The container uses `network_mode: host` to allow natpmpc to communicate with your gateway. If you're running on a system where host networking isn't available (like Docker Desktop on Mac/Windows), you may need to adjust the networking configuration.

## Troubleshooting

**Connection Issues**: Ensure your gateway IP is correct and that NAT-PMP is enabled on your router.

**Permission Errors**: Some routers require specific configuration to allow NAT-PMP requests.

**WebSocket Disconnections**: The application will automatically attempt to reconnect every 3 seconds.

## License

MIT
