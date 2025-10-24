#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script validates that all required environment variables are set
 * before starting the application. Run with: node validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Define required and optional environment variables
const requiredVars = [
  {
    name: 'JWT_SECRET',
    description: 'JWT secret for token signing',
    generateCmd: 'openssl rand -base64 32',
    critical: true,
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth secret for session management',
    generateCmd: 'openssl rand -base64 32',
    critical: true,
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'NextAuth URL for authentication',
    default: 'http://localhost:3000',
    critical: false,
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API key for AI features',
    getUrl: 'https://makersuite.google.com/app/apikey',
    critical: true,
  },
  {
    name: 'POSTGRES_URL',
    description: 'PostgreSQL connection string (Neon)',
    critical: true,
  },
];

const optionalVars = [
  {
    name: 'NODE_ENV',
    description: 'Environment (development/production)',
    default: 'development',
    critical: false,
  },
];

// Check if a value looks like a placeholder
function isPlaceholder(value) {
  if (!value) return true;
  const placeholders = [
    'your_jwt_secret_here',
    'your_nextauth_secret_here',
    'your_gemini_api_key_here',
    'CHANGE_THIS',
    'your-',
    'example',
  ];
  return placeholders.some(p => value.toLowerCase().includes(p.toLowerCase()));
}

// Validate environment variables
function validateEnvironment() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Environment Variables Validation${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;
  const errors = [];
  const warnings = [];
  const success = [];

  // Check .env.local existence
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠ Warning: .env.local file not found${colors.reset}`);
    console.log(`${colors.yellow}  Copy .env.example to .env.local and configure it${colors.reset}\n`);
    hasWarnings = true;
  }

  // Check required variables
  console.log(`${colors.blue}Required Variables:${colors.reset}\n`);

  requiredVars.forEach(({ name, description, generateCmd, getUrl, critical, default: defaultValue }) => {
    const value = process.env[name];

    if (!value) {
      const msg = `✗ ${name} - ${description}`;
      if (critical) {
        errors.push(msg);
        console.log(`${colors.red}${msg}${colors.reset}`);
        if (generateCmd) {
          console.log(`${colors.yellow}  Generate with: ${generateCmd}${colors.reset}`);
        }
        if (getUrl) {
          console.log(`${colors.yellow}  Get from: ${getUrl}${colors.reset}`);
        }
        hasErrors = true;
      } else if (defaultValue) {
        warnings.push(msg);
        console.log(`${colors.yellow}${msg}${colors.reset}`);
        console.log(`${colors.yellow}  Using default: ${defaultValue}${colors.reset}`);
        hasWarnings = true;
      }
    } else if (isPlaceholder(value)) {
      const msg = `⚠ ${name} - Appears to be a placeholder value`;
      errors.push(msg);
      console.log(`${colors.red}${msg}${colors.reset}`);
      console.log(`${colors.yellow}  Current value looks like: "${value.substring(0, 30)}..."${colors.reset}`);
      if (generateCmd) {
        console.log(`${colors.yellow}  Generate with: ${generateCmd}${colors.reset}`);
      }
      hasErrors = true;
    } else {
      const msg = `✓ ${name} - Configured`;
      success.push(msg);
      console.log(`${colors.green}${msg}${colors.reset}`);
    }
  });

  // Check optional variables
  console.log(`\n${colors.blue}Optional Variables:${colors.reset}\n`);

  optionalVars.forEach(({ name, description, default: defaultValue }) => {
    const value = process.env[name];

    if (!value) {
      const msg = `○ ${name} - ${description}`;
      console.log(`${colors.yellow}${msg}${colors.reset}`);
      if (defaultValue) {
        console.log(`${colors.yellow}  Using default: ${defaultValue}${colors.reset}`);
      }
    } else {
      const msg = `✓ ${name} - Configured (${value})`;
      success.push(msg);
      console.log(`${colors.green}${msg}${colors.reset}`);
    }
  });

  // Summary
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  Summary${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  if (hasErrors) {
    console.log(`${colors.red}❌ Validation FAILED${colors.reset}`);
    console.log(`${colors.red}${errors.length} critical issue(s) found${colors.reset}\n`);

    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(`${colors.yellow}1. Copy .env.example to .env.local:${colors.reset}`);
    console.log(`${colors.yellow}   cp .env.example .env.local${colors.reset}`);
    console.log(`${colors.yellow}2. Edit .env.local and set required variables${colors.reset}`);
    console.log(`${colors.yellow}3. Run this script again: node validate-env.js${colors.reset}\n`);

    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠ Validation passed with warnings${colors.reset}`);
    console.log(`${colors.yellow}${warnings.length} warning(s) found${colors.reset}`);
    console.log(`${colors.green}${success.length} variable(s) configured correctly${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ Validation PASSED${colors.reset}`);
    console.log(`${colors.green}All required environment variables are configured${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
validateEnvironment();
