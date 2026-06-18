import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, OrgGuard } from '../../../common/guards';
import { CurrentOrg } from '../../../common/decorators';
import { IntegrationsService } from './integrations.service';
import { SaveLlmKeyDto, type LlmProvider } from './dto/llm-key.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('settings/integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get('llm')
  @ApiOperation({ summary: 'List configured LLM providers' })
  listLlm(@CurrentOrg('id') orgId: string) {
    return this.service.listLlmKeys(orgId);
  }

  @Patch('llm')
  @ApiOperation({ summary: 'Save LLM provider API key' })
  saveLlm(@CurrentOrg('id') orgId: string, @Body() dto: SaveLlmKeyDto) {
    return this.service.saveLlmKey(orgId, dto.provider, dto.apiKey);
  }

  @Delete('llm/:provider')
  @ApiOperation({ summary: 'Remove LLM provider API key' })
  removeLlm(@CurrentOrg('id') orgId: string, @Param('provider') provider: LlmProvider) {
    return this.service.removeLlmKey(orgId, provider);
  }
}
