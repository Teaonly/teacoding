import type {
    Agent,
    AgentEvent,
    AgentMessage,
    AgentState,
    AgentTool,
    ThinkingLevel,
} from "./agent/index";


export enum BuiltinTool {
    Read = "Read file contents",
    Bash = "Execute bash commands (ls, grep, find, etc.)",
    Edit = "Make surgical edits to files (find exact text and replace)",
    Write = "Create or overwrite files",
    Grep = "Search file contents for patterns (respects .gitignore)",
    Find = "Find files by glob pattern (respects .gitignore)",
    Ls = "List directory contents",
};

// 编码智能体实现，配置三件套: 工具+提示词+SKILLS，运行AgentLoop，返回结果。
// 内置：状态可观察可控制（中断、修改等），错误重试，最终答案整理
export class CodingAgent {
    readonly agent: Agent;
    private _cwd: string;
    
    constructor() {
            
    }
}

