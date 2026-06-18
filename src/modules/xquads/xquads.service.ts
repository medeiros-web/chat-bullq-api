import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmService } from '../ai-agents/llm/llm.service';
import type { LlmMessage } from '../ai-agents/llm/llm.types';
import { IntegrationsService } from '../settings/integrations/integrations.service';
import type { XquadsChatDto } from './dto/chat.dto';

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
  xai: 'grok-3',
};

const PROVIDER_BASE_URL: Record<string, string | undefined> = {
  openai: undefined,
  google: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  xai: 'https://api.x.ai/v1',
};

@Injectable()
export class XquadsService {
  constructor(
    private readonly llm: LlmService,
    private readonly integrations: IntegrationsService,
  ) {}

  async chat(dto: XquadsChatDto, orgId: string): Promise<{ message: string }> {
    const provider = dto.provider ?? 'anthropic';

    if (provider === 'anthropic') {
      return this.chatWithAnthropic(dto);
    }

    const apiKey = await this.integrations.getLlmKey(orgId, provider as any);
    if (!apiKey) {
      throw new BadRequestException(
        `Provedor "${provider}" não está configurado. Acesse Configurações > Integrações para adicionar a chave.`,
      );
    }

    return this.chatWithOpenAiCompat(dto, provider, apiKey);
  }

  private async chatWithAnthropic(dto: XquadsChatDto): Promise<{ message: string }> {
    const modelId = dto.model ?? 'claude-sonnet-4-6';
    const messages: LlmMessage[] = [
      { role: 'system', content: dto.systemPrompt },
      ...dto.messages.map((m) => ({ role: m.role as LlmMessage['role'], content: m.content })),
    ];
    const result = await this.llm.complete({ modelId, messages, maxTokens: 2048 });
    return { message: typeof result.message.content === 'string' ? result.message.content : '' };
  }

  private async chatWithOpenAiCompat(
    dto: XquadsChatDto,
    provider: string,
    apiKey: string,
  ): Promise<{ message: string }> {
    const baseURL = PROVIDER_BASE_URL[provider];
    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    const model = dto.model ?? PROVIDER_DEFAULT_MODEL[provider] ?? 'gpt-4o';

    const completion = await client.chat.completions.create({
      model,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: dto.systemPrompt },
        ...dto.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    });

    return { message: completion.choices[0]?.message?.content ?? '' };
  }
}
