module.exports = {
  apps: [
    {
      name: 'cambio-api',
      script: './apps/api/dist/src/main.js',
      cwd: './',
      instances: '1',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 30000, // 30 seconds to wait for the app to shutdown gracefully
      wait_ready: true,
      listen_timeout: 10000,
      // Restart behavior
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
