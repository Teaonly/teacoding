#!/usr/bin/env node

import dotenv from 'dotenv';
import { defaultModel } from './providers';
import { defaultConfig, buildAgent} from './coding-agent';

async function main() {
    let agent = buildAgent(defaultConfig, defaultModel);
    agent.setThinkingLevel("medium");
    await agent.prompt("Hello");
}

// Load environment variables from .env file
dotenv.config();
// 启动应用程序
main().catch(console.error);
