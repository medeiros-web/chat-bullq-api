import { Injectable } from '@nestjs/common';
import { LlmService } from '../ai-agents/llm/llm.service';
import type { LlmMessage } from '../ai-agents/llm/llm.types';
import type { XquadsChatDto } from './dto/chat.dto';

const PROVIDER_MODEL_MAP: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'claude-sonnet-4-6',   // fallback to Claude until OpenAI wired
  google: 'claude-sonnet-4-6',   // fallback to Claude until Gemini wired
  xai: 'claude-sonnet-4-6',      // fallback to Claude until xAI wired
};

@Injectable()
export class XquadsService {
  constructor(private readonly llm: LlmService) {}

  async chat(dto: XquadsChatDto): Promise<{ message: string }> {
    const modelId = dto.model ?? PROVIDER_MODEL_MAP[dto.provider ?? 'anthropic'] ?? 'claude-sonnet-4-6';

    const messages: LlmMessage[] = [
      { role: 'system', content: dto.systemPrompt },
      ...dto.messages.map((m) => ({ role: m.role as LlmMessage['role'], content: m.content })),
    ];

    const result = await this.llm.complete({ modelId, messages, maxTokens: 2048 });
    return { message: typeof result.message.content === 'string' ? result.message.content : '' };
  }
}
