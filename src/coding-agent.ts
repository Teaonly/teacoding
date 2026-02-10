import { Model, Api} from '@mariozechner/pi-ai';
import  {Agent, AgentTool} from "./agent/index";
import {type Skill, loadSkills, formatSkillsForPrompt, 
        readTool, bashTool, writeTool, editTool} from "./coding/index";

// 内置工具集
export enum BuiltinTool {
    Read =  "- read: Read file contents",
    Bash =  "- bash: Execute bash commands (ls, grep, find, etc.)",
    Edit =  "- edit: Make surgical edits to files (find exact text and replace)",
    Write = "- write: Create or overwrite files",
    Grep =  "- grep: Search file contents for patterns (respects .gitignore)",
    Find =  "- find: Find files by glob pattern (respects .gitignore)",
    Ls =    "- list: List directory contents",
};

// 配置三件套: 提示词+工具+SKILLS，
export interface CodingAgentConfig {
    selectedTools: Set<BuiltinTool> ;
    systemPrompt: string;
    skills: Skill[];
    
    cwd?: string;
    appendSystemPrompt?: string;
    contextFiles?: Array<{ path: string; content: string }>;
}

// 构造默认配置
export const defaultConfig: CodingAgentConfig = (()=>{
    const defaultTools: Set<BuiltinTool> = new Set([BuiltinTool.Read, BuiltinTool.Bash, BuiltinTool.Edit, BuiltinTool.Write]);
    const toolsString = Array.from(defaultTools).join("\n");
    let prompt = `You are an expert coding assistant operating inside pi, a coding agent harness. You help users by reading files, executing commands, editing code, and writing new files.

Available tools:
${toolsString}

Guidelines:
- Use bash for file operations like ls, rg, find.
- Use read to examine files before editing. You must use this tool instead of cat or sed.
- Use edit for precise changes (old text must match exactly).
- Use write only for new files or complete rewrites.
- When summarizing your actions, output plain text directly - do NOT use cat or bash to display what you did.`;
    
    // 默认加载当前执行目录下的 SKILLS 
    const skills = loadSkills(["./"]);
    const config : CodingAgentConfig = {
        selectedTools: defaultTools,
        systemPrompt: prompt,
        skills: skills,
        cwd: process.cwd(),
    };
    return config;
})();

function fullSystemPrompt(config: CodingAgentConfig): string {
    let prompt = config.systemPrompt;
    if (config.appendSystemPrompt) {
		prompt += `\n\n${config.appendSystemPrompt}`;
	}

    // 基于文件的上下文，直接加载内容
    if (config.contextFiles && config.contextFiles.length > 0) {
		prompt += "\n\n# Project Context\n\n";
		prompt += "Project-specific instructions and guidelines:\n\n";

        let contextFiles = config.contextFiles;
		for (const { path: filePath, content } of contextFiles) {
			prompt += `## ${filePath}\n\n${content}\n\n`;
		}
	}

    // SKILLS 加载
    if ( config.selectedTools.has( BuiltinTool.Read ) && config.skills.length > 0 ) {
        prompt += formatSkillsForPrompt(config.skills);
    }

    // Add date/time and working directory last
    const now = new Date();
    const dateTime = now.toLocaleString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZoneName: "short",
	});
    const resolvedCwd = config.cwd ?? process.cwd();

	prompt += `\n\nCurrent date and time: ${dateTime}`;
	prompt += `\nCurrent working directory: ${resolvedCwd}`;

    return prompt;
}

function listAgentTools(config: CodingAgentConfig) : AgentTool[] {
    let tools: AgentTool[] = [];
    for (const t of config.selectedTools) {
        tools.push(t);
    }

    return tools;
}

// 编码智能体实现，配置三件套: 工具+提示词+SKILLS，运行AgentLoop，返回结果。
// 内置：状态可观察可控制（中断、修改等），错误重试，最终答案整理
export function buildAgent( config: CodingAgentConfig, model: Model<Api>): Agent {
    const tools = listAgentTools(config);
    const fullPrompt = fullSystemPrompt(config);
    
    const agent = new Agent({
        // Initial state
        initialState: {
            systemPrompt: fullPrompt,
            model: model,
            tools: tools
        },
        // API_KEY
        getApiKey: async (provider:string) => {
            if ( process.env.BIGMODEL_API_KEY ) {
                return process.env.BIGMODEL_API_KEY as string;
            }
            throw new Error(`无法获得 BIGMODEL_API_KEY for ${provider}`);
        }
    });
    return agent;
}


