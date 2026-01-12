module.exports = {
    apps: [{
        name: 'leaderboard-backend',
        script: './src/index.js',
        instances: 'max', // Use all available CPU cores
        exec_mode: 'cluster', // Enable Node.js cluster mode
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
