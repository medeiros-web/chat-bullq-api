import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { LlmProvider } from './dto/llm-key.dto';

interface LlmKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
  xai?: string;
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listLlmKeys(orgId: string): Promise<{ provider: LlmProvider; isConfigured: boolean }[]> {
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    const keys = (settings.llmKeys ?? {}) as LlmKeys;

    const providers: LlmProvider[] = ['anthropic', 'openai', 'google', 'xai'];
    return providers.map((provider) => ({
      provider,
      isConfigured: !!(keys[provider]),
    }));
  }

  async saveLlmKey(orgId: string, provider: LlmProvider, apiKey: string): Promise<void> {
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    const keys = { ...((settings.llmKeys ?? {}) as LlmKeys), [provider]: apiKey };
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { settings: { ...settings, llmKeys: keys } },
    });
  }

  async removeLlmKey(orgId: string, provider: LlmProvider): Promise<void> {
    const org = await this.prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    const keys = { ...((settings.llmKeys ?? {}) as LlmKeys) };
    delete keys[provider];
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { settings: { ...settings, llmKeys: keys } },
    });
  }

  async getLlmKey(orgId: string, provider: LlmProvider): Promise<string | null> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return null;
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    const keys = (settings.llmKeys ?? {}) as LlmKeys;
    return keys[provider] ?? null;
  }
}
