import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiTool, ToolContext, ToolResult } from '../tool.types';

/**
 * Returns the full pitch + price + checkout link for a product owned by
 * the org. Sales agents see a compact list of all products in their
 * system prompt and call this skill with a slug when actually
 * recommending — keeps the prompt small while letting the agent
 * pull authoritative copy on demand instead of inventing.
 *
 * Backend source: Trivapp (members area). Each tenant in Trivapp owns
 * its sales offers under /api/v1/catalog/:slug. Auth via
 * x-admin-api-key + x-tenant-id headers (same pattern admin-actions).
 *
 * Env required:
 * - MEMBERS_TRIVAPP_URL (default https://members.bravy.school)
 * - MEMBERS_ADMIN_KEY
 * - MEMBERS_TENANT_BRAVY (TODO: per-org mapping when multi-tenant)
 */
@Injectable()
export class GetProductPitchTool implements AiTool {
  private readonly logger = new Logger(GetProductPitchTool.name);

  readonly name = 'getProductPitch';
  readonly description =
    'Puxa o pitch completo + preço + link de checkout de um produto do catálogo. Use ANTES de citar preço/link/diferenciais — não invente nada, sempre busque aqui. Slug vem da lista no system prompt.';
  readonly parameters = {
    type: 'object',
    additionalProperties: false,
    required: ['slug'],
    properties: {
      slug: {
        type: 'string',
        description:
          'Slug do produto (ex: "maestria"). Lista de slugs disponível no Catálogo do system prompt.',
        minLength: 1,
        maxLength: 80,
      },
    },
  };

  constructor(private readonly config: ConfigService) {}

  async execute(
    input: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!slug) {
      return { output: { ok: false, error: 'slug obrigatório' } };
    }

    const baseUrl =
      this.config.get<string>('MEMBERS_TRIVAPP_URL') ??
      'https://members.bravy.school';
    const apiKey = this.config.get<string>('MEMBERS_ADMIN_KEY');
    const tenantId = this.config.get<string>('MEMBERS_TENANT_BRAVY');

    if (!apiKey || !tenantId) {
      this.logger.warn(
        'Trivapp credentials missing (MEMBERS_ADMIN_KEY / MEMBERS_TENANT_BRAVY)',
      );
      return {
        output: {
          ok: false,
          error: 'Trivapp não configurado no servidor — fale com o admin',
        },
      };
    }

    try {
      const resp = await axios.get(`${baseUrl}/api/v1/catalog/${slug}`, {
        headers: {
          'x-admin-api-key': apiKey,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      });

      this.logger.log(
        `getProductPitch served ${slug} (org=${ctx.organizationId})`,
      );

      return { output: { ok: true, product: resp.data } };
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message ?? err?.message;
      this.logger.warn(
        `getProductPitch failed for ${slug}: ${status ?? '?'} ${detail}`,
      );
      if (status === 404) {
        return {
          output: {
            ok: false,
            error: `Produto "${slug}" não encontrado no catálogo. Confira a lista de slugs no Catálogo.`,
          },
        };
      }
      return {
        output: {
          ok: false,
          error: `Falha ao consultar catálogo: ${detail}`,
        },
      };
    }
  }
}
