module.exports = {
  apps: [
    {
      name: 'belhagh-form',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://belhagh:belhagh@2026!secure@127.0.0.1:5432/belhagh_db',
        BACKUP_SECRET_KEY: 'belhagh_backup_token_2026',
        MELIPAYAMAK_USERNAME: '9120449093',
        MELIPAYAMAK_PASSWORD: '627eeb6c-8e98-4563-9160-dc2f60d293e3'
      }
    }
  ]
};
