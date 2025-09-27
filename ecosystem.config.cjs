module.exports = {
  apps: [{
    name: "saro",
    script: "server/index.ts",
    interpreter: "node",
    interpreter_args: "--loader tsx",
    env: {
      NODE_ENV: "development",
      PORT: "5000"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: "5000"
    },
    // Production optimizations
    instances: 1, // Single instance for now, can scale later
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    exp_backoff_restart_delay: 2000,
    min_uptime: "10s",
    max_restarts: 10,
    
    // Logging configuration
    log_file: "./logs/saro-combined.log",
    out_file: "./logs/saro-out.log",
    error_file: "./logs/saro-error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    
    // Environment file loading
    env_file: ".env",
    
    // Auto-restart configuration
    autorestart: true,
    ignore_watch: [
      "node_modules",
      "logs",
      "client/dist",
      "*.log"
    ],
    
    // Health monitoring
    kill_timeout: 5000,
    listen_timeout: 10000
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: "root",
      host: "your-vps-ip",
      ref: "origin/main",
      repo: "https://github.com/sahidx/saro.git",
      path: "/var/www/saro",
      "pre-deploy-local": "",
      "post-deploy": "npm install && pm2 reload ecosystem.config.cjs --env production",
      "pre-setup": ""
    }
  }
}
