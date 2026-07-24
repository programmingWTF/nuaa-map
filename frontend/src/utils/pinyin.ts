/**
 * 轻量级拼音匹配工具 —— 零依赖
 * 覆盖天目湖校区 36 栋建筑名称中出现的全部汉字
 */

// 汉字 → 拼音（不带声调）
const CHAR_MAP: Record<string, string> = {
  // 方向/位置
  西: 'xi', 东: 'dong', 南: 'nan', 北: 'bei', 中: 'zhong',
  门: 'men', 楼: 'lou', 台: 'tai', 场: 'chang', 馆: 'guan',
  厅: 'ting', 站: 'zhan', 所: 'suo', 区: 'qu', 园: 'yuan',
  苑: 'yuan', 湖: 'hu', 山: 'shan', 水: 'shui', 天: 'tian',
  空: 'kong', 地: 'di',
  // 建筑名用字
  巡: 'xun', 牧: 'mu', 星: 'xing', 笃: 'du', 行: 'xing',
  知: 'zhi', 尚: 'shang', 德: 'de', 明: 'ming', 慧: 'hui',
  问: 'wen', 图: 'tu', 书: 'shu', 餐: 'can', 篱: 'li',
  体: 'ti', 育: 'yu', 游: 'you', 泳: 'yong', 风: 'feng',
  雨: 'yu', 操: 'cao', 综: 'zong', 合: 'he', 服: 'fu',
  务: 'wu', 师: 'shi', 生: 'sheng', 大: 'da', 学: 'xue',
  校: 'xiao', 医: 'yi', 院: 'yuan', 泗: 'si', 垃: 'la',
  圾: 'ji', 转: 'zhuan', 开: 'kai', 闭: 'bi', 看: 'kan',
  职: 'zhi', 工: 'gong', 公: 'gong', 寓: 'yu',
  // 数字/字母（保持原样）
};

/**
 * 将中文文本转为全拼字符串（空格分隔）
 * "巡天楼" → "xun tian lou"
 */
export function toPinyin(text: string): string {
  let result = '';
  for (const ch of text) {
    const py = CHAR_MAP[ch];
    if (py) {
      result += (result ? ' ' : '') + py;
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      result += (result ? ' ' : '') + ch.toLowerCase();
    }
    // 其他字符（标点等）跳过
  }
  return result;
}

/**
 * 取中文文本的拼音首字母
 * "巡天楼" → "xtl"
 */
export function toPinyinAbbr(text: string): string {
  let result = '';
  for (const ch of text) {
    const py = CHAR_MAP[ch];
    if (py) {
      result += py[0];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch.toLowerCase();
    }
  }
  return result;
}
