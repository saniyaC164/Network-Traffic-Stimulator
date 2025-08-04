const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { initializeNetwork } = require('./network');

// Import routes
const simulateRouter = require('./routes/simulate');

// Create Express app
const app = express();

// Environment configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: NODE_ENV === 'production'
        ? [CORS_ORIGIN, /\.netlify\.app$/, /\.vercel\.app$/]
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
}));

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Initialize network simulation
try {
    initializeNetwork();
    console.log('✅ Network simulation initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize network simulation:', error);
    process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.use('/api/simulate', simulateRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Network Traffic Simulator API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            simulation: '/api/simulate',
            docs: '/api/docs'
        },
        timestamp: new Date().toISOString()
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Network Traffic Simulator API Documentation',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}/api/simulate`,
        endpoints: [
            {
                method: 'GET',
                path: '/stats',
                description: 'Get current network statistics',
                response: 'Network state with nodes, links, and packet information'
            },
            {
                method: 'POST',
                path: '/tick',
                description: 'Execute single simulation tick',
                response: 'Updated network statistics after simulation step'
            },
            {
                method: 'POST',
                path: '/start',
                description: 'Start continuous simulation',
                response: 'Success confirmation'
            },
            {
                method: 'POST',
                path: '/pause',
                description: 'Pause ongoing simulation',
                response: 'Success confirmation'
            },
            {
                method: 'POST',
                path: '/reset',
                description: 'Reset simulation to initial state',
                response: 'Success confirmation'
            },
            {
                method: 'POST',
                path: '/traffic/:nodeId',
                description: 'Update traffic generation rate for specific node',
                body: '{ "rate": number }',
                response: 'Success confirmation'
            },
            {
                method: 'POST',
                path: '/link/:from/:to/capacity',
                description: 'Update link capacity between two nodes',
                body: '{ "capacity": number }',
                response: 'Success confirmation'
            },
            {
                method: 'POST',
                path: '/advance-time',
                description: 'Advance to next time slot',
                response: 'Success confirmation with new time'
            },
            {
                method: 'GET',
                path: '/topology',
                description: 'Get network topology structure',
                response: 'Nodes and links structure for visualization'
            }
        ]
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The route ${req.method} ${req.originalUrl} does not exist`,
        availableRoutes: [
            'GET /',
            'GET /health',
            'GET /api/docs',
            'GET /api/simulate/stats',
            'POST /api/simulate/tick'
        ]
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Global Error Handler:', {
        message: error.message,
        stack: NODE_ENV === 'development' ? error.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Invalid JSON in request body',
            message: 'Please check your JSON syntax'
        });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'File too large',
            message: 'Request body exceeds maximum allowed size'
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        error: NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
        timestamp: new Date().toISOString(),
        ...(NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

    const server = app.listen(PORT);

    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }

        console.log('✅ Server closed successfully');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('❌ Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Network Traffic Simulator Backend`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔗 CORS Origin: ${CORS_ORIGIN}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`⚡ Ready to accept connections!`);
});

// Export app for testing
module.exports = app;