#!/usr/bin/env node

process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_SKIP_TYPE_CHECKS = '1';
process.env.NEXT_SKIP_OPT_ROUTES = '1';

require('next/dist/bin/next');

