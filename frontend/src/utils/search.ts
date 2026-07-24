/**
 * 搜索工具函数 —— 零依赖
 */

/**
 * Levenshtein 编辑距离
 * 计算将 a 变为 b 所需的最少编辑（插入/删除/替换）次数
 * 距离越小 → 越相似
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // 只用两行，节省内存
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // 插入
        prev[j] + 1,           // 删除
        prev[j - 1] + cost,    // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * 在候选列表中找出与 query 最相似的前 n 项
 * 按编辑距离升序排列，距离过大（> 阈值）的排除
 */
export function findSimilar(
  query: string,
  candidates: { id: string; name: string }[],
  limit = 3,
  maxDistance = 5,
) {
  const q = query.toLowerCase();
  return candidates
    .map(c => ({ ...c, dist: levenshtein(q, c.name.toLowerCase()) }))
    .filter(c => c.dist > 0 && c.dist <= maxDistance)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);
}
