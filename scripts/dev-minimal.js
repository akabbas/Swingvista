#!/usr/bin/env node

// Set environment variables to minimize dev startup time
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_SKIP_TYPE_CHECKS = '1';
process.env.NEXT_SKIP_OPT_ROUTES = '1';
process.env.NEXT_MINIMAL = '1';
process.env.NEXT_SKIP_TRANSFORMS = '1';
process.env.NEXT_SKIP_PREFLIGHT = '1';

// Disable webpack optimization in development
process.env.NEXT_WEBPACK_OPTIMIZE = '0';

require('next/dist/bin/next');

