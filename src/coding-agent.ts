import type {
    Agent,
    AgentEvent,
    AgentMessage,
    AgentState,
    AgentTool,
    ThinkingLevel,
} from "./agent/index";


// 内置工具集
export enum BuiltinTool {
    Read = "Read file contents, Use read to examine files before editing. You must use this tool instead of cat or sed.",
    Bash = "Execute bash commands (mkdir, cp, mv, etc.) ",
    Edit = "Make surgical edits to files (find exact text and replace)",
    Write = "Create or overwrite files",
    Grep = "Search file contents for patterns (respects .gitignore)",
    Find = "Find files by glob pattern (respects .gitignore)",
    Ls = "List directory contents",
};

export interface CodingAgentConfig {
           
}

// 默认提示词，用户可以复用
const defaultPrompt : string = (() =>{
    let prompt = `
You are an expert coding assistant, a coding agent harness. You help users by reading files, executing commands, editing code, and writing new files.

Available tools:
{_TOOL_LIST_}

In addition to the tools above, you may have access to other custom tools depending on the project.`
})();

const defaultConfig: GrepOperations = {
         
};


// 编码智能体实现，配置三件套: 工具+提示词+SKILLS，运行AgentLoop，返回结果。
// 内置：状态可观察可控制（中断、修改等），错误重试，最终答案整理
export function createCodingAgent(

