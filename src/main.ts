#!/usr/bin/env node

import dotenv from 'dotenv';
import minimist from 'minimist';
import { Agent, AgentEvent} from './agent';
import { BuiltinTool } from "./coding";
import { defaultModel , defaultKey} from './providers';
import { buildAgent } from './coding-agent';

async function main(userTask: string, cwd?: string, skillPaths?: string[]) {
    const tools = [BuiltinTool.Read, BuiltinTool.Write, BuiltinTool.Edit, BuiltinTool.Bash];
    let agent: Agent = buildAgent(defaultModel, defaultKey, tools, cwd, skillPaths);

    let turn:number = 1;
    agent.subscribe((evt: AgentEvent) => {
        switch (evt.type) {
            case "agent_start":
                console.log(`\x1b[33m\x1b[1mAgent 开始执行任务...\x1b[0m\n`);
                break;

            case "agent_end":
                console.log(`\x1b[32m\x1b[1m✓ Agent 执行完成\x1b[0m`);
                break;

            case "turn_start":
                console.log();
                console.log(`\x1b[34m\x1b[1m回合 ${turn} 开始\x1b[0m`);
                console.log(`\x1b[90m${'─'.repeat(42)}\x1b[0m`);
                break;

            case "turn_end":
                console.log(`\x1b[34m\x1b[1m回合 ${turn} 完成\x1b[0m`);
                turn++;
                break;

            case "message_start":
                if (evt.message.role === "assistant") {
                    console.log(`\x1b[36m\x1b[1m 正在思考...\x1b[0m`);
                }
                break;

            case "message_update":
                // 流式输出时显示内容更新（可以选择显示或静默）
                break;

            case "message_end":
                if (evt.message.role === "assistant") {
                    console.log(`\x1b[36m✓ 思考完成\x1b[0m`);
                }
                break;

            case "tool_execution_start":
                console.log(`\x1b[35m🔧 执行工具: \x1b[1m${evt.toolName}\x1b[0m`);
                console.log(`\x1b[90m   参数: ${JSON.stringify(evt.args, null, 2)}\x1b[0m`);
                break;

            case "tool_execution_update":
                // 显示工具执行的中间结果
                console.log(`\x1b[90m   ${evt.partialResult}\x1b[0m`);
                break;

            case "tool_execution_end":
                if (evt.isError) {
                    console.log(`\x1b[31m✗ 工具执行失败: ${evt.toolName}\x1b[0m`);
                } else {
                    console.log(`\x1b[32m✓ 工具执行完成: ${evt.toolName}\x1b[0m`);
                }
                break;
        }
    });
    await agent.prompt(userTask);
    if (agent.state.error) {
        console.log(`\x1b[31m\x1b[1m✗ Agent 执行错误: ${agent.state.error}\x1b[0m`);
    } else {
        // 彩色醒目的标题
        console.log(`\n\x1b[36m\x1b[1m══════════════════最后结果════════════════\x1b[0m`);
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

// ====== 命令行配置 ======
const CLI_CONFIG = {
    name: 'teacoding',
    version: '1.0.0',
    description: 'AI 编码助手，自动执行开发任务',
    options: [
        {
            short: 'h',
            long: 'help',
            description: '显示帮助信息',
            type: 'boolean'
        },
        {
            short: 'c',
            long: 'cwd',
            description: '指定工作目录',
            type: 'string'
        },
        {
            short: 's',
            long: 'skills',
            description: '指定技能文件路径（支持逗号分隔或多次使用）',
            type: 'array'
        }
    ]
} as const;

/**
 * 显示帮助信息
 */
function showHelp() {
    const { name, version, description, options } = CLI_CONFIG;

    console.log(`\n\x1b[1m\x1b[36m${name}\x1b[0m v${version}`);
    console.log(`\x1b[90m${description}\x1b[0m\n`);
    console.log(`\x1b[1m用法:\x1b[0m`);
    console.log(`  ${name} [选项] <任务>\n`);
    console.log(`\x1b[1m选项:\x1b[0m`);

    // 计算最长选项宽度
    const maxOptWidth = Math.max(
        ...options.map(opt => (`-${opt.short}, --${opt.long}`).length)
    );

    for (const opt of options) {
        const optStr = `-${opt.short}, --${opt.long}`;
        const padding = ' '.repeat(maxOptWidth - optStr.length + 2);
        console.log(`  \x1b[32m${optStr}\x1b[0m${padding}${opt.description}`);
    }

    console.log(`\n\x1b[1m示例:\x1b[0m`);
    console.log(`  ${name} "帮我重构这个文件"`);
    console.log(`  ${name} -c /path/to/project "添加单元测试"`);
    console.log(`  ${name} -s skills/custom.ts "使用自定义技能"`);
    console.log(`  ${name} -s skill1.ts -s skill2.ts "使用多个技能"\n`);
}

/**
 * 解析命令行参数
 */
function parseArgs(args: string[]) {
    const argv = minimist(args, {
        string: ['cwd', 'skills'],
        alias: {
            h: 'help',
            c: 'cwd',
            s: 'skills'
        },
        default: { skills: [] }
    });

    // 检查是否显示帮助
    if (argv.help) {
        showHelp();
        process.exit(0);
    }

    // 解析技能路径
    let skillPaths: string[] = [];
    if (argv.skills) {
        if (Array.isArray(argv.skills)) {
            skillPaths = argv.skills.flatMap((s: string) => s.split(','));
        } else {
            skillPaths = (argv.skills as string).split(',');
        }
        skillPaths = skillPaths.filter(s => s.trim());
    }

    return {
        task: argv._[0],
        cwd: argv.cwd,
        skills: skillPaths
    };
}

// 解析并执行
const { task: userTask, cwd, skills: skillPaths } = parseArgs(process.argv.slice(2));

if (!userTask) {
    console.log('\x1b[31m错误: 请指定需要执行的任务\x1b[0m\n');
    showHelp();
    process.exit(1);
}

main(userTask, cwd, skillPaths).catch(console.error);
