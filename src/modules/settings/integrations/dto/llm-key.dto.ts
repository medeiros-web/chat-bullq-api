import { IsIn, IsString } from 'class-validator';

export type LlmProvider = 'anthropic' | 'openai' | 'google' | 'xai';

export class SaveLlmKeyDto {
  @IsIn(['anthropic', 'openai', 'google', 'xai'])
  provider: LlmProvider;

  @IsString()
  apiKey: string;
}
