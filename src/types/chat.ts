export interface ChatMessage {
  botId?: string;
  channelId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ChatReply {
  text: string;
  model: string;
  sources: Array<{
    id: string;
    title: string;
  }>;
}

