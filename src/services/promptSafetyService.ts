import type { KnowledgeDocument } from "../types/bot";

const SUSPICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /ignore\s+all\s+prior\s+rules/gi,
  /system\s+prompt/gi,
  /developer\s+message/gi,
  /jailbreak/gi,
  /do\s+anything\s+now/gi,
  /<\s*system\s*>/gi,
  /<\s*assistant\s*>/gi,
  /<\s*developer\s*>/gi,
  /<\s*tool\s*>/gi,
  /```[\s\S]*?```/g,
];

const MAX_USER_MESSAGE_LENGTH = 2000;
interface StructuredReply {
  answer: string;
  citedSourceIds: string[];
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripSuspiciousPatterns(value: string) {
  return SUSPICIOUS_PATTERNS.reduce((result, pattern) => result.replace(pattern, " "), value);
}

function escapeAngleBrackets(value: string) {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeUserMessage(message: string) {
  const trimmed = message.slice(0, MAX_USER_MESSAGE_LENGTH);
  const stripped = stripSuspiciousPatterns(trimmed);

  return escapeAngleBrackets(normalizeWhitespace(stripped));
}

export function sanitizeKnowledgeDocument(document: KnowledgeDocument): KnowledgeDocument {
  return {
    ...document,
    title: escapeAngleBrackets(normalizeWhitespace(stripSuspiciousPatterns(document.title))),
    content: escapeAngleBrackets(normalizeWhitespace(stripSuspiciousPatterns(document.content))),
    tags: document.tags?.map((tag) => escapeAngleBrackets(normalizeWhitespace(stripSuspiciousPatterns(tag)))),
  };
}

export function sanitizeKnowledgeDocuments(documents: KnowledgeDocument[]) {
  return documents.map(sanitizeKnowledgeDocument);
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i) ?? trimmed.match(/```([\s\S]*?)```/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

export function parseStructuredReply(raw: string): StructuredReply | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<StructuredReply>;
    const answer = typeof parsed.answer === "string" ? normalizeWhitespace(parsed.answer) : "";
    const citedSourceIds = Array.isArray(parsed.citedSourceIds)
      ? parsed.citedSourceIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (!answer) {
      return null;
    }

    return {
      answer,
      citedSourceIds,
    };
  } catch {
    return null;
  }
}

export function selectCitedSources(citedSourceIds: string[], sources: KnowledgeDocument[]) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return citedSourceIds.map((id) => sourceMap.get(id)).filter((source): source is KnowledgeDocument => Boolean(source));
}

export function isStructuredReplySafe(reply: StructuredReply | null, sources: KnowledgeDocument[]) {
  if (!reply || sources.length === 0) {
    return false;
  }

  if (reply.citedSourceIds.length === 0) {
    return false;
  }

  const allowedIds = new Set(sources.map((source) => source.id));
  return reply.citedSourceIds.every((id) => allowedIds.has(id));
}
