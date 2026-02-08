#!/usr/bin/env node

import dotenv from 'dotenv';
import { Type, stream, complete, Context, Tool, StringEnum } from '@mariozechner/pi-ai'

import { defaultModel } from './providers';

async function main() {
  const tools: Tool[] = [{
    name: 'get_time',
    description: 'Get the current time',
    parameters: Type.Object({
      timezone: Type.Optional(Type.String({ description: 'Optional timezone (e.g., America/New_York)' }))
    })
  }];

  const context: Context = {
      systemPrompt: 'You are a helpful assistant.',
      messages: [{
        role: 'user', 
        content: '当前的时间？', 
        timestamp: Date.now()
      }],
      tools
  };


  const s = stream(defaultModel, context);
  for await (const event of s) {
    console.log(`${event.type}`);
  }
  const finalMessage = await s.result();
  context.messages.push(finalMessage);
  console.log(finalMessage)

  // Handle tool calls if any
  const toolCalls = finalMessage.content.filter(b => b.type === 'toolCall');
  for (const call of toolCalls) {
    // Execute the tool
    const result = call.name === 'get_time'
      ? new Date().toLocaleString('zh-CN', {
          timeZone: call.arguments.timezone || 'Asia/Shanghai',
          dateStyle: 'full',
          timeStyle: 'long'
        })
      : 'Unknown tool';

    // Add tool result to context (supports text and images)
    context.messages.push({
      role: 'toolResult',
      toolCallId: call.id,
      toolName: call.name,
      content: [{ type: 'text', text: result }],
      isError: false,
      timestamp: Date.now()
    });
  }

  // Continue if there were tool calls
  if (toolCalls.length > 0) {
    const continuation = await complete(defaultModel, context);
    context.messages.push(continuation);
    console.log('After tool execution:', continuation.content);
  }


  // Option 2: Get complete response without streaming
  const response = await complete(defaultModel, context);

  for (const block of response.content) {
    if (block.type === 'text') {
      console.log(block.text);
    } else if (block.type === 'toolCall') {
      console.log(`Tool: ${block.name}(${JSON.stringify(block.arguments)})`);
    }
  }


}

// Load environment variables from .env file
dotenv.config();
// 启动应用程序
main().catch(console.error);
