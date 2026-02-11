#!/usr/bin/env node

import dotenv from 'dotenv';
import { AgentEvent } from './agent/index';
import { defaultModel } from './providers';
import { defaultConfig, buildAgent} from './coding-agent';
import { eventNames } from 'node:cluster';

async function main(userTask: string) {
    let agent = buildAgent(defaultConfig, defaultModel);

    let turn:number = 1;
    agent.subscribe((evt: AgentEvent) => {
        if (evt.type === "agent_start") {
            console.log( "----------Agent Begin---------------");
        } else if ( evt.type === "agent_end") {
            console.log( "---Agent End---");
        } else if ( evt.type === "turn_start") {
            console.log(`\t开始新一轮模型调用: ${turn}`);
            turn++;
        } else if ( evt.type === "turn_end" ) {
            console.log(`\t结束当前轮模型调用`);    
        } else if ( evt.type === "message_start" ) {
            console.log(`\t\t接收模型消息...`);
        } else if ( evt.type === "message_end" ) {
            console.log(`\t\t模型消息完毕`);
        } else if ( evt.type === "tool_execution_start" ) {
            console.log(`\t\t=>执行工具 ${evt.toolName}`);
        }
    });
    await agent.prompt(userTask);
    if (agent.state.error) {
        console.log(`\x1b[31m\x1b[1m✗ Agent 执行错误: ${agent.state.error}\x1b[0m`);
    } else {
        // 彩色醒目的标题
        console.log(`\x1b[36m\x1b[1m══════════════════最后答案════════════════\x1b[0m`);
        console.log();

        const lastIndex = agent.state.messages.length
        for (const ctn of agent.state.messages[lastIndex - 1].content) {
            if (typeof ctn === 'string' ) {
                console.log(`${ctn}`);
                break;
            } else if (ctn.type == "text") {
                console.log(`${ctn.text}`);
                break;
            }
        }
        console.log();
        console.log(`\x1b[90m${'─'.repeat(42)}\x1b[0m`);
    }
}

// Load environment variables from .env file
dotenv.config();

// 从命令行参数获取用户任务
if (process.argv.length < 3) {
    console.log( "请输入需要执行的任务..." );
} else { 
    const userTask = process.argv[2];
    main(userTask).catch(console.error);
}
