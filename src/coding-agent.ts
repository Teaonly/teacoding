
import { Model } from '@mariozechner/pi-ai';
import { Agent, AgentTool } from './agent';
import {type Skill, loadSkills, formatSkillsForPrompt, BuiltinTool,
        createAllTools} from "./coding";

// 通过构造：提示词+工具+SKILLS 三件套，任务版本，标准4个工具，加载SKILLS
export function buildAgent(model: Model<any>, apikey: string, selectedTools: BuiltinTool[], cwd: string | undefined = undefined, skillPaths: string[] = [] ) : Agent {
    // 检查是否有重复工具设置
    const _selectedTools = new Set(selectedTools);
    if (_selectedTools.size != selectedTools.length) {
        throw Error("工具集不能重复！");
    }
    const toolsString = selectedTools.join("\n");
    // 构建工具集
    const resolvedCwd = cwd ?? process.cwd();
    const cwdTools = createAllTools(resolvedCwd)
    const tools: AgentTool<any>[] = [];
    for (const t of selectedTools) {
        if (t === BuiltinTool.Read ) {
            tools.push( cwdTools.read );
        } else if (t == BuiltinTool.Bash) {
            tools.push( cwdTools.bash );
        } else if (t == BuiltinTool.Write) {
            tools.push( cwdTools.write );
        } else if (t == BuiltinTool.Edit) {
            tools.push( cwdTools.edit );
        } else if (t == BuiltinTool.Find) {
            tools.push( cwdTools.find );
        } else if (t == BuiltinTool.Grep) {
            tools.push( cwdTools.grep );
        } else if (t == BuiltinTool.Ls ) {
            tools.push( cwdTools.ls );
        } else {
            throw Error(`错误的工具:${t}`);
        }
    }
    
    // 最简系统提示词，简单说明一下工具使用
    let prompt = `You are an expert coding assistant operating inside a general agent harness. You help users by reading files, executing commands, editing code, and writing new files.
    
Available tools:
${toolsString}

Guidelines:
- Use bash for file operations like ls, rg, find.
- Use read to examine files before editing. You must use this tool instead of cat or sed.
- Use edit for precise changes (old text must match exactly).
- Use write only for new files or complete rewrites.
- When summarizing your actions, output plain text directly - do NOT use cat or bash to display what you did.`;

    // 技能相关提示词部分
    const skills : Skill[] = loadSkills(skillPaths);
    if (skills.length > 0) {
        prompt += formatSkillsForPrompt(skills);
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

	prompt += `\n\nCurrent date and time: ${dateTime}`;
    prompt += `\nCurrent working directory: ${resolvedCwd}`;

    // 构建 Agent 主体
    const agent = new Agent({
        // Initial state
        initialState: {
            systemPrompt: prompt,
            model: model,
            tools: tools
        },
        
        // API_KEY
        getApiKey: async (provider:string) => {
            if ( process.env[apikey] ) {
                return process.env[apikey] as string;
            }
            throw new Error(`无法从环境变量中获得 API_KEY for ${provider}`);
        }
    });
    return agent;
}