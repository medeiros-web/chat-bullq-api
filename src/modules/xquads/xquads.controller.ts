import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, OrgGuard } from '../../common/guards';
import { XquadsService } from './xquads.service';
import { XquadsChatDto } from './dto/chat.dto';

@ApiTags('Xquads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('xquads')
export class XquadsController {
  constructor(private readonly service: XquadsService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with an Xquads AI agent' })
  chat(@Body() dto: XquadsChatDto) {
    return this.service.chat(dto);
  }
}
