import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IntegrationsController } from './integrations/integrations.controller';
import { IntegrationsService } from './integrations/integrations.service';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class SettingsModule {}
