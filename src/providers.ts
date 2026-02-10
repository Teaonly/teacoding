import { Model } from '@mariozechner/pi-ai';

const glmModel: Model<'openai-completions'> = {
  id: 'GLM-4.7',
  name: 'BigModel',
  api: 'openai-completions',
  provider: '智谱编码套餐',
  baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
  reasoning: true,
  input: ['text'],
  cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128000,
  maxTokens: 16384,
  compat: {
    supportsStore: false, 
    supportsDeveloperRole: false,
  }
};

export const defaultModel = glmModel;
export { glmModel };
