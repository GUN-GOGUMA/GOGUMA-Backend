export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface BotConfig {
  botId: string;
  displayName: string;
  personality: string;
  fallbackMessage?: string;
  knowledgeBase: KnowledgeDocument[];
}

