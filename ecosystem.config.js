module.exports = {
  apps: [{
    name: "coach-manager",
    script: "dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: "5051",
      DATABASE_URL: "postgres://rahman:rahman@127.0.0.1:5432/coachdb",
      SEED: "false",
      // SESSION_SECRET: "change-me"
    },
    watch: false,
    exp_backoff_restart_delay: 2000,
    max_memory_restart: "300M"
  }]
}
