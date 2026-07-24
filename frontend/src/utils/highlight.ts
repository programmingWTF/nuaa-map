/**
 * 关键词高亮工具
 * 将文本中匹配的部分用 <mark> 包裹，大小写不敏感
 * 使用 JSX 片段方式（安全，无 dangerouslySetInnerHTML）
 */

import type { ReactNode } from 'react';

/**
 * 在 text 中查找 query 并高亮
 * @returns 文本片段 + <mark> 元素组成的 ReactNode 数组
 */
export function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim() || !text) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');

  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(<mark key={match.index}>{match[0]}</mark>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : text;
}
