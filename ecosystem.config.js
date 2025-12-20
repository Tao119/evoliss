module.exports = {
  apps: [
    {
      name: "evoliss",
      script: "npm",
      args: "start",
      cwd: "/var/www/evoliss",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
      // クラッシュした場合の再起動設定
      min_uptime: "10s",
      max_restarts: 5,
      // 本番環境設定
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // ヘルスチェック設定
      health_check_grace_period: 3000,
      // ログローテーション
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // プロセス管理
      kill_timeout: 5000,
      listen_timeout: 8000,
      // 環境変数ファイル読み込み
      env_file: ".env",
    },
  ],
};
