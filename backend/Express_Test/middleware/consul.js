const Consul = require('consul');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Read values from .env file
const CONSUL_SERVICE_ID = process.env.CONSUL_SERVICE_ID;
const CONSUL_SERVICE_NAME = process.env.CONSUL_SERVICE_NAME;
const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_PORT = parseInt(process.env.CONSUL_PORT, 10) || 443; // Default to 443 if not provided
const SERVICE_PORT = parseInt(process.env.PORT, 10) || 8000; // Default to 8000 if PORT is not set

// Create a Consul client
const consul = new Consul({
    host: CONSUL_HOST,
    port: CONSUL_PORT,
    secure: true, // Enable HTTPS for Consul on Render
    promisify: true,
});

// Function to register service
const registerService = async () => {
    try {
        console.log(`🚀 Registering Service: ${CONSUL_SERVICE_NAME} (${CONSUL_SERVICE_ID})...`);

        await consul.agent.service.register({
            id: CONSUL_SERVICE_ID,
            name: CONSUL_SERVICE_NAME,
            address: CONSUL_HOST, // Ensure this matches your service's IP or domain
            port: SERVICE_PORT, // Your actual service running port
            check: {
                http: `https://${CONSUL_HOST}/v1/agent/checks`, // Use HTTPS for health checks
                interval: '10s',
                timeout: '5s',
            },
        });

        console.log(`✅ ${CONSUL_SERVICE_NAME} successfully registered in Consul`);

        // Verify registered services after a delay
        setTimeout(async () => {
            await logRegisteredServices();
        }, 3000);

    } catch (err) {
        console.error('❌ Error registering service in Consul:', err);
    }
};

// Function to log registered services in Consul
const logRegisteredServices = async () => {
    try {
        const services = await consul.agent.service.list();
        console.log('🔍 Registered Services in Consul:', services);
    } catch (err) {
        console.error('❌ Error fetching registered services:', err);
    }
};

// Gracefully deregister service when shutting down
process.on('SIGINT', async () => {
    try {
        await consul.agent.service.deregister(CONSUL_SERVICE_ID);
        console.log(`✅ ${CONSUL_SERVICE_NAME} deregistered from Consul`);
        process.exit();
    } catch (err) {
        console.error('❌ Error deregistering service:', err);
        process.exit(1);
    }
});

// Start registration process
registerService();

module.exports = consul;
