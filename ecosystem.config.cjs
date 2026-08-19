module.exports = {
  apps: [
    {
      name: "caspxx-front",
      script: "npx",
      args: "vite preview --port 5173 --host",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
