# Gemini Token Manager

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-supported-brightgreen)
![NodeJS](https://img.shields.io/badge/nodejs-16%2B-orange)

**A load balancing service for managing Gemini API tokens, supporting Docker deployment and data persistence**  
**This project is based on the UI of [Siliconflow-API-Management](https://github.com/Dr-Ai-0018/Siliconflow-API-Management)**  
English | [简体中文](./README.md)

</div>

## 📋 Table of Contents

-   [Features](#-features)
-   [Requirements](#-requirements)
-   [Quick Start](#-quick-start)
-   [Project Structure](#-project-structure)
-   [Configuration](#-configuration)
-   [Common Commands](#-common-commands)
-   [Development Guide](#-development-guide)
-   [Troubleshooting](#-troubleshooting)
-   [Contributing](#-contributing)
-   [License](#-license)
-   [Contact](#-contact)

## ✨ Features

-   🔄 Automatic data file initialization
-   💾 Data persistence storage
-   🐳 Docker containerized deployment
-   🔌 RESTful API interface
-   ⚙️ Environment variable configuration
-   🔑 Batch Key Management (New)
    - Support batch add, delete, and check keys
    - Support exporting selected keys
    - Smart invalid key detection
-   📊 Enhanced Management Interface
    - Optimized key management page
    - Pagination control
    - Intuitive batch operation toolbar
-   🔍 Comprehensive Logging System
    - Detailed proxy service logs
    - Enhanced error handling
-   📝 Rich Example Code
    - Python usage examples
    - One-click copy functionality

## 📌 Requirements

-   Docker
-   Docker Compose
-   Node.js 16+ (development environment only)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. Clone the project

```bash
git clone https://github.com/zqq-nuli/Gemini-Token-Manager.git
cd gemini-token-manager
```

2. Start the service

```bash
docker compose up -d
```

The service will start at http://localhost:7001

<details>
<summary>Installation without Docker</summary>

1. Clone the project and install dependencies

```bash
git clone https://github.com/zqq-nuli/Gemini-Token-Manager.git
cd gemini-token-manager
npm install
```

2. Start the development server

```bash
npm run dev
```

</details>

## 📂 Project Structure

```
.
├── Dockerfile          # Docker build file
├── docker-compose.yml  # Docker Compose configuration
├── package.json        # Project dependencies
├── init.js            # Initialization script
├── data/              # Data storage directory (auto-created)
└── src/               # Source code directory
```

## ⚙️ Configuration

### PM2 Configuration

The project uses PM2 for process management, configured in `ecosystem.config.js`. Main configuration items include:

| Config Item | Description | Default Value |
|------------|-------------|---------------|
| `instances` | Number of instances | `max` (production) / `2` (Docker) |
| `exec_mode` | Execution mode | `cluster` |
| `max_memory_restart` | Memory limit | `300M` (production) / `150M` (Docker) |

### Data Persistence

Data files are stored by default in the `data` folder in the project root directory. This directory is automatically mapped to `/app/data` in the Docker container.

### Environment Variables

The following environment variables can be configured by modifying the `docker-compose.yml` file:

| Variable Name | Description | Default Value |
|--------------|-------------|---------------|
| `NODE_ENV` | Running environment | `production` |
| `FORCE_INIT` | Force data reinitialization | `false` |

## 🛠 Common Commands

### PM2 Process Management

```bash
# Start service with PM2
npm run pm2

# Start service with PM2 in Docker environment
npm run pm2:docker

# Stop service
npm run pm2:stop

# Restart service
npm run pm2:restart

# Reload service
npm run pm2:reload

# Delete service
npm run pm2:delete

# View logs
npm run pm2:logs
```

### Service Management

```bash
# Start service
docker compose up -d

# View logs
docker compose logs -f

# Stop service
docker compose down

# Restart service
docker compose restart

# Rebuild and start
docker compose up -d --build
```

### Data Management

```bash
# Force data reinitialization
# Method 1: Delete initialization flag file
rm ./data/.initialized
docker compose restart

# Method 2: Use environment variable
FORCE_INIT=true docker compose up -d
```

## 💻 Development Guide

### Local Development

1. Install dependencies

```bash
npm install
```

2. Choose one of the following methods to run the service:

```bash
# Development mode
npm run dev

# Run with PM2 (production environment)
npm run pm2

# Run with PM2 in Docker environment
npm run pm2:docker
```

## 🔧 Troubleshooting

If you encounter any issues, please try the following steps:

1. Check the logs using `docker compose logs -f`
2. Ensure all required ports are available
3. Verify the configuration in `docker-compose.yml`
4. Try forcing a data reinitialization

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📮 Contact

If you have any questions or suggestions, please feel free to open an issue. 