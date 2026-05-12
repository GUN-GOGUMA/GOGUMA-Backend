import type { KnowledgeDocument } from "../types/bot";

const MAX_RESULTS = 5;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function scoreDocument(questionTokens: string[], document: KnowledgeDocument) {
  const haystack = normalizeText(
    [document.title, document.content, ...(document.tags ?? [])].join(" "),
  );

  return questionTokens.reduce((score, token) => {
    if (!haystack.includes(token)) {
      return score;
    }

    const titleBonus = normalizeText(document.title).includes(token) ? 2 : 0;
    const tagBonus = (document.tags ?? []).some((tag) => normalizeText(tag).includes(token)) ? 1 : 0;

    return score + 1 + titleBonus + tagBonus;
  }, 0);
}

export function retrieveRelevantKnowledge(question: string, knowledgeBase: KnowledgeDocument[]) {
  const questionTokens = tokenize(question);

  if (questionTokens.length === 0) {
    return knowledgeBase.slice(0, MAX_RESULTS);
  }

  return knowledgeBase
    .map((document) => ({
      document,
      score: scoreDocument(questionTokens, document),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RESULTS)
    .map((item) => item.document);
}

