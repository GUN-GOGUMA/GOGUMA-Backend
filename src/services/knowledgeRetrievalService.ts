import type { KnowledgeDocument } from "../types/bot";

const MAX_RESULTS = 5;
const MIN_TOKEN_LENGTH = 2;
const HANGUL_OR_WORD_SEQUENCE = /[\p{Script=Hangul}\p{L}\p{N}]+/gu;

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
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

function extractPhrases(value: string) {
  return Array.from(value.matchAll(HANGUL_OR_WORD_SEQUENCE), (match) => match[0].toLowerCase()).filter(
    (token) => token.length >= MIN_TOKEN_LENGTH,
  );
}

function buildCharacterNgrams(value: string, size = 2) {
  const compact = normalizeText(value).replace(/\s+/g, "");

  if (compact.length < size) {
    return compact ? [compact] : [];
  }

  const ngrams: string[] = [];
  for (let index = 0; index <= compact.length - size; index += 1) {
    ngrams.push(compact.slice(index, index + size));
  }

  return ngrams;
}

function scoreDocument(questionTokens: string[], document: KnowledgeDocument) {
  const titleText = normalizeText(document.title);
  const contentText = normalizeText(document.content);
  const tagTexts = (document.tags ?? []).map(normalizeText);
  const haystack = [titleText, contentText, ...tagTexts].join(" ");
  const questionPhrases = extractPhrases(questionTokens.join(" "));
  const originalQuestion = questionTokens.join(" ");
  const questionNgrams = Array.from(new Set(buildCharacterNgrams(originalQuestion)));

  let score = questionTokens.reduce((total, token) => {
    if (!haystack.includes(token)) {
      return total;
    }

    const titleBonus = titleText.includes(token) ? 3 : 0;
    const tagBonus = tagTexts.some((tag) => tag.includes(token)) ? 2 : 0;

    return total + 1 + titleBonus + tagBonus;
  }, 0);

  score += questionPhrases.reduce((total, phrase) => {
    if (!haystack.includes(phrase)) {
      return total;
    }

    const titleBonus = titleText.includes(phrase) ? 4 : 0;
    const tagBonus = tagTexts.some((tag) => tag.includes(phrase)) ? 2 : 0;

    return total + 2 + titleBonus + tagBonus;
  }, 0);

  if (score === 0 && questionNgrams.length > 0) {
    const matchedNgrams = questionNgrams.filter((ngram) => haystack.includes(ngram)).length;
    if (matchedNgrams >= 2) {
      score += matchedNgrams;
    }
  }

  return score;
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

