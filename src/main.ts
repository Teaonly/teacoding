#!/usr/bin/env node

import dotenv from 'dotenv';
import { defaultModel } from './providers';
import { defaultConfig } from './coding-agent';
async function main() {
    console.log( defaultConfig );
    console.log("Hello world")
}

// Load environment variables from .env file
dotenv.config();
// 启动应用程序
main().catch(console.error);
