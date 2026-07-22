/**
 * 基于关键词匹配的知识库问答引擎，支持模糊匹配和最佳答案排序。
 *
 * 分词策略：中文单字 + bigram 双字组合，提高校园短查询（如「图书馆几点关门」）的召回率。
 * 停用词覆盖问句高频词（请问/怎么/什么/为什么），降低噪音。
 * 匹配文本仅使用问题文本（不含答案），避免长答案抬高无关条目分值。
 */

import qaData from '../data/qa-新生问答.json';

export interface QaEntry {
  id: string;
  question: string;
  answer: string;
}

export interface MatchResult {
  entry: QaEntry;
  score: number;
}

interface QaDataSet {
  questions: QaEntry[];
}

/** 从 JSON 中获取所有问答条目 */
export function getAllEntries(): QaEntry[] {
  return (qaData as QaDataSet).questions ?? [];
}

/**
 * 分词：提取用户输入中的关键词
 * 忽略常见停用词
 */
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
  '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
  '它', '们', '那', '些', '吗', '啊', '呢', '吧', '嗯', '哦',
  '怎么', '什么', '如何', '哪里', '哪个', '哪些', '何时',
  '多少', '几', '啥', '咋', '为啥', '为什么', '请问', '请',
]);

export function tokenize(text: string): string[] {
  // 先按空格/标点分割
  const raw = text.toLowerCase().split(/[\s,，。！？、；：""''（）()【】《》/\\|]+/);
  const tokens: string[] = [];
  for (const token of raw) {
    // 对中文进行逐字分词 + bigram 增加匹配率
    if (/[一-鿿]/.test(token)) {
      // 提取单字
      for (const ch of token) {
        if (/[一-鿿]/.test(ch) && !STOP_WORDS.has(ch)) {
          tokens.push(ch);
        }
      }
      // 提取双字组合
      for (let i = 0; i < token.length - 1; i++) {
        const bigram = token.substring(i, i + 2);
        if (!STOP_WORDS.has(bigram)) {
          tokens.push(bigram);
        }
      }
      // 包含完整词
      if (!STOP_WORDS.has(token)) {
        tokens.push(token);
      }
    } else if (token.length > 0 && !STOP_WORDS.has(token)) {
      tokens.push(token);
    }
  }
  return [...new Set(tokens)]; // 去重
}

/**
 * 计算用户分词结果与问答条目的匹配分数
 * @param userTokens 预计算的用户输入分词（由调用方传入，避免对每个条目重复分词）
 * @param qaEntry 问答条目
 */
function scoreQuestion(userTokens: string[], qaEntry: QaEntry): number {
  if (userTokens.length === 0) return 0;

  // 仅在问题文本中匹配（不含答案，避免长答案拉高分值）
  const questionText = qaEntry.question.toLowerCase();

  let matchCount = 0;
  let exactMatchBonus = 0;

  for (const token of userTokens) {
    if (questionText.includes(token)) {
      matchCount++;
      // 完整词匹配加分
      if (token.length >= 3 && questionText.includes(token)) {
        exactMatchBonus += 2;
      } else if (token.length >= 2) {
        exactMatchBonus += 1;
      }
    }
  }

  return (matchCount / userTokens.length) * 100 + exactMatchBonus;
}

/**
 * 匹配用户输入，返回最佳答案
 * @param userInput 用户输入的问题文本
 * @returns 匹配结果（含分数和条目），无匹配返回 null
 */
export function matchBestAnswer(userInput: string): MatchResult | null {
  const entries = getAllEntries();
  if (entries.length === 0) return null;

  // 完全相等 → 直接返回最高分（在遍历前处理，避免无谓打分）
  const exact = entries.find(e => e.question === userInput);
  if (exact) {
    return { entry: exact, score: 200 };
  }

  // 预计算用户输入的分词（所有条目共用，避免重复分词）
  const userTokens = tokenize(userInput);

  const scores: MatchResult[] = [];
  for (const entry of entries) {
    const score = scoreQuestion(userTokens, entry);
    if (score > 0) {
      scores.push({ entry, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  // 阈值 25：需要 2-3 个有意义的字符匹配才能通过
  if (scores.length > 0 && scores[0].score >= 25) {
    return scores[0];
  }

  return null;
}

/**
 * 获取相关推荐问题，供「猜你想问」使用
 * @param userInput 用户输入（传空字符串返回默认推荐）
 * @param topN 返回条目数
 */
export function getRelatedQuestions(userInput: string, topN: number = 3): QaEntry[] {
  const entries = getAllEntries();
  if (entries.length === 0) return [];

  // 空查询：默认返回前 N 个条目
  const trimmed = userInput.trim();
  if (!trimmed) {
    return entries.slice(0, topN);
  }

  // 预计算分词（所有条目共用）
  const userTokens = tokenize(trimmed);
  const scored = entries
    .map(entry => ({ entry, score: scoreQuestion(userTokens, entry) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map(s => s.entry);
}
