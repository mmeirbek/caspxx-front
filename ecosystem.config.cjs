module.exports = {
  apps: [
    {
      name: "jol-map-frontend",
      script: "npx",
      args: "vite preview --port 5173 --host",
      cwd: "/home/aibek/projects/RRAI/jol-map",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
