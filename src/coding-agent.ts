import type {
    Agent,
    AgentEvent,
    AgentMessage,
    AgentState,
    AgentTool,
    ThinkingLevel,
} from "./agent/index";
import {type Skill, loadSkills} from "./coding/skills";


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
    selectedTools: BuiltinTool[];
    systemPrompt: string;
    skills: Skill[];
    cwd: string;

    appendSystemPrompt?: string;
    contextFiles?: Array<{ path: string; content: string }>;
}

// 构造默认配置
export const defaultConfig: CodingAgentConfig = (()=>{
    const defaultTools: BuiltinTool[] = [BuiltinTool.Read, BuiltinTool.Bash, BuiltinTool.Edit, BuiltinTool.Write];
    const toolsString = defaultTools.join("\n");
    let prompt = `You are an expert coding assistant operating inside pi, a coding agent harness. You help users by reading files, execut

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

// 编码智能体实现，配置三件套: 工具+提示词+SKILLS，运行AgentLoop，返回结果。
// 内置：状态可观察可控制（中断、修改等），错误重试，最终答案整理

