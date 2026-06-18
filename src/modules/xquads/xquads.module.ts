import { Module } from '@nestjs/common';
import { LlmModule } from '../ai-agents/llm/llm.module';
import { SettingsModule } from '../settings/settings.module';
import { XquadsController } from './xquads.controller';
import { XquadsService } from './xquads.service';

@Module({
  imports: [LlmModule, SettingsModule],
  controllers: [XquadsController],
  providers: [XquadsService],
})
export class XquadsModule {}
