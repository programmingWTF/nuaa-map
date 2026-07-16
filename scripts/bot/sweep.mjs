// NUAAMap AI 维护 Bot — ClawSweeper 风格
// 部署在 NAS，DeepSeek 调用显式走 EasyConnect SOCKS5 代理
// 运行方式: GH_TOKEN=ghp_xxx DEEPSEEK_KEY=sk-xxx node sweep.mjs [daily|backfill]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const CONFIG = {
  GH_TOKEN: process.env.GH_TOKEN || "",
  REPO: "programmingWTF/nuaa-map",
  REPO_API: "https://api.github.com/repos/programmingWTF/nuaa-map",
  BOT_LOGIN: "LiGuiyu-AI",

  DEEPSEEK_API: "https://token.nuaa.edu.cn/v1/chat/completions",
  DEEPSEEK_MODEL: "deepseek-v4-pro",
  DEEPSEEK_KEY: process.env.DEEPSEEK_KEY || "",

  STATE_FILE: join(__dirname, "state.json"),
  MAX_ITEMS_PER_RUN: 10,
};

// ============================================================
// 标签体系 — 模仿 ClawSweeper，段位用王者荣耀
// ============================================================

const LABELS = {
  // 规模 — 继承 ClawSweeper Size: XS/S/M/L/XL（字母保留英文）
  size: [
    { name: "规模：XS", color: "8C959F", desc: "极简改动，预计几分钟" },
    { name: "规模：S", color: "8C959F", desc: "小改动，预计半天内" },
    { name: "规模：M", color: "8C959F", desc: "中等改动，预计 1-3 天" },
    { name: "规模：L", color: "8C959F", desc: "大改动，预计 3-7 天" },
    { name: "规模：XL", color: "8C959F", desc: "超大改动，预计超过 1 周" },
  ],
  // 优先级 — P0-P3
  priority: [
    { name: "优先级：P0", color: "B60205", desc: "紧急：安全漏洞、崩溃、核心功能不可用" },
    { name: "优先级：P1", color: "D93F0B", desc: "高：用户可见 Bug、功能回归" },
    { name: "优先级：P2", color: "FBCA04", desc: "中：常规任务" },
    { name: "优先级：P3", color: "8C959F", desc: "低：优化、文档、锦上添花" },
  ],
  // 段位 — 王者荣耀 7 级（替代 ClawSweeper 海洋生物评级）
  rank: [
    { name: "段位：未定级", color: "8C2F39", desc: "信息不足，尚无法评估质量" },
    { name: "段位：倔强青铜", color: "8B5A2B", desc: "初具雏形，仍需补充大量信息" },
    { name: "段位：秩序白银", color: "A0A4A8", desc: "基本清晰，可以正常处理" },
    { name: "段位：荣耀黄金", color: "D4A017", desc: "描述完整，质量不错" },
    { name: "段位：永恒钻石", color: "00BCD4", desc: "高质量，细节到位" },
    { name: "段位：至尊星耀", color: "7B1FA2", desc: "非常出色，堪称范例" },
    { name: "段位：最强王者", color: "E65100", desc: "顶级质量，完美无瑕" },
  ],
  // 类型
  type: [
    { name: "类型：Bug", color: "D73A4A", desc: "功能异常，需要修复" },
    { name: "类型：功能请求", color: "0969DA", desc: "新功能或改进建议" },
    { name: "类型：文档", color: "0A3069", desc: "文档改进或补充" },
    { name: "类型：设计优化", color: "A371F7", desc: "UI/UX 设计改进" },
    { name: "类型：问题咨询", color: "6E7781", desc: "需要讨论或答疑" },
  ],
  // 小组
  team: [
    { name: "小组：①手绘地图", color: "FF6B6B", desc: "地图底图、图标、CSS、UI 设计" },
    { name: "小组：②交互功能", color: "4ECDC4", desc: "前端交互、地图点击、弹窗、聊天界面" },
    { name: "小组：③平台搭建", color: "45B7D1", desc: "项目配置、构建脚本、部署、CI/CD" },
    { name: "小组：④数据采集", color: "96CEB4", desc: "QA 知识库、建筑信息数据" },
    { name: "小组：⑤AI智能体", color: "DDA0DD", desc: "RAG、聊天 API、智能问答" },
    { name: "小组：⑥坐标标注", color: "F0B27A", desc: "数据转换脚本、像素坐标标注" },
  ],
  // 状态
  status: [
    { name: "状态：需要更多信息", color: "6E7781", desc: "等待作者补充信息" },
    { name: "状态：等待确认", color: "FBCA04", desc: "等待维护者确认" },
    { name: "状态：已确认", color: "0E8A16", desc: "问题已被确认存在" },
    { name: "状态：进行中", color: "0F2CCE", desc: "正在处理中" },
    { name: "状态：等待审核", color: "2DA44E", desc: "PR 等待审核" },
    { name: "状态：准备合并", color: "0E8A16", desc: "PR 可以合并" },
  ],
  // 杂项
  misc: [
    { name: "no-stale", color: "8C959F", desc: "排除在过时自动关闭之外" },
    { name: "重复", color: "D1D5DB", desc: "此 Issue 或 PR 已存在" },
  ],
};

// 扁平化为数组
const VALID_LABELS = [
  ...LABELS.size,
  ...LABELS.priority,
  ...LABELS.rank,
  ...LABELS.type,
  ...LABELS.team,
  ...LABELS.status,
  ...LABELS.misc,
].map((l) => l.name);

// ============================================================
// 工具函数
// ============================================================

function log(...args) {
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  console.log(`[${ts}]`, ...args);
}

function loadState() {
  const defaults = { reviewed: {}, lastDailySweep: null };
  if (!existsSync(CONFIG.STATE_FILE)) return defaults;
  try {
    const raw = JSON.parse(readFileSync(CONFIG.STATE_FILE, "utf-8"));
    return { ...defaults, ...raw, reviewed: { ...defaults.reviewed, ...(raw.reviewed || {}) } };
  }
  catch { return defaults; }
}

function saveState(state) {
  mkdirSync(dirname(CONFIG.STATE_FILE), { recursive: true });
  writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
}

async function ghAPI(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${CONFIG.REPO_API}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CONFIG.GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function extractIssueNumber(issueUrl) {
  const m = issueUrl?.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

// ============================================================
// 标签管理
// ============================================================

async function ensureLabelsExist() {
  try {
    const existing = await ghAPI("/labels?per_page=100");
    const existingNames = new Set(existing.map((l) => l.name));

    const allLabels = [
      ...LABELS.size, ...LABELS.priority, ...LABELS.rank,
      ...LABELS.type, ...LABELS.team, ...LABELS.status, ...LABELS.misc,
    ];

    // 创建缺失的新标签
    let created = 0;
    for (const { name, color, desc } of allLabels) {
      if (existingNames.has(name)) continue;
      await ghAPI("/labels", {
        method: "POST",
        body: JSON.stringify({ name, color, description: desc }),
      });
      log(`  🏷️ 创建标签: ${name}`);
      created++;
    }

    // 删除不在新体系中的旧标签
    let deleted = 0;
    for (const label of existing) {
      if (!VALID_LABELS.includes(label.name)) {
        await ghAPI(`/labels/${encodeURIComponent(label.name)}`, { method: "DELETE" });
        log(`  🗑️ 删除旧标签: ${label.name}`);
        deleted++;
      }
    }

    if (created === 0 && deleted === 0) log("  ✅ 所有标签已就绪");
    else log(`  ✅ 创建 ${created} 个，清理 ${deleted} 个旧标签`);
  } catch (e) {
    log(`  ⚠️ 标签管理失败: ${e.message}`);
  }
}

async function setLabels(issueNumber, labels) {
  if (!labels || labels.length === 0) return;
  const valid = labels.filter((l) => VALID_LABELS.includes(l));
  if (valid.length === 0) return;
  try {
    await ghAPI(`/issues/${issueNumber}/labels`, {
      method: "PUT",
      body: JSON.stringify({ labels: valid }),
    });
  } catch (e) {
    log(`  ⚠️ 设置标签失败: ${e.message}`);
  }
}

async function postComment(issueNumber, body) {
  if (!body) return null;
  try {
    const res = await ghAPI(`/issues/${issueNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    return res.id;
  } catch (e) {
    log(`  ⚠️ 评论失败: ${e.message}`);
    return null;
  }
}

async function updateComment(commentId, body) {
  if (!body || !commentId) return;
  try {
    await ghAPI(`/issues/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  } catch (e) {
    log(`  ⚠️ 更新评论失败: ${e.message}`);
  }
}

// ============================================================
// DeepSeek API
// ============================================================

function callDeepSeek(messages) {
  const body = JSON.stringify({
    model: CONFIG.DEEPSEEK_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  });

  const cmd = [
    "curl -s --connect-timeout 15 --max-time 60",
    "--proxy socks5h://127.0.0.1:1080",
    `-H "Authorization: Bearer ${CONFIG.DEEPSEEK_KEY}"`,
    `-H "Content-Type: application/json"`,
    `-d '${body.replace(/'/g, "'\\''")}'`,
    CONFIG.DEEPSEEK_API,
  ].join(" ");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const stdout = execSync(cmd, {
        encoding: "utf-8",
        timeout: 65000,
        stdio: ["pipe", "pipe", "pipe"],
      });
      const data = JSON.parse(stdout);
      if (data.error) {
        throw new Error(`API error: ${JSON.stringify(data.error)}`);
      }
      return data;
    } catch (e) {
      if (attempt === 3) {
        const msg = e.stdout ? e.stdout.toString().slice(0, 100) : e.message;
        throw new Error(`DeepSeek 不可达 (尝试${attempt}次): ${msg}`);
      }
      log(`  ⚠️ DeepSeek 第${attempt}次失败，${2 ** attempt}秒后重试...`);
      const waitMs = 2 ** attempt * 1000;
      const end = Date.now() + waitMs;
      while (Date.now() < end) { /* spin */ }
    }
  }
}

// ============================================================
// AI System Prompt
// ============================================================

const SYSTEM_PROMPT = `你是 NUAAMap 项目的 AI 维护助手（ClawSweeper），帮助大学生暑期社会实践团队管理 GitHub Issue 和 Pull Request。

## 项目背景
NUAAMap 是南京航空航天大学天目湖校区的智能校园地图网站，技术栈 React + TypeScript + Vite。团队 14 人分 6 个小组。

## 行为准则
1. **友善第一**：这是学习项目。代码风格不好、commit 不规范都完全 OK。
2. **鼓励优先**：先说好的地方，再给建议。用"可以试试"而不是"你应该"。
3. **段位评定**：用王者荣耀段位评估 Issue/PR 质量，给段位并解释为什么。只能打 1 个段位标签。
4. **标签全面且不矛盾**：打标签前全面思考，覆盖规模、优先级、段位、类型、小组、状态六个维度（每维度最多 1 个标签）。段位绝不能同时打两个。小组可以多个。必须一次性打全，不要遗漏维度。
5. **不随便关**：除非广告或无意义内容，不主动建议关闭。

## 段位体系（王者荣耀）
从低到高：未定级 → 倔强青铜 → 秩序白银 → 荣耀黄金 → 永恒钻石 → 至尊星耀 → 最强王者
- Issue：标题清晰度、复现步骤、截图/日志、环境信息
- PR：改动合理性、代码质量、说明、范围是否聚焦

## 标签
规模：规模：XS / 规模：S / 规模：M / 规模：L / 规模：XL
优先级：优先级：P0 / 优先级：P1 / 优先级：P2 / 优先级：P3
段位：段位：未定级 / 段位：倔强青铜 / 段位：秩序白银 / 段位：荣耀黄金 / 段位：永恒钻石 / 段位：至尊星耀 / 段位：最强王者
类型：类型：Bug / 类型：功能请求 / 类型：文档 / 类型：设计优化 / 类型：问题咨询
小组：小组：①手绘地图 / 小组：②交互功能 / 小组：③平台搭建 / 小组：④数据采集 / 小组：⑤AI智能体 / 小组：⑥坐标标注
状态：状态：需要更多信息 / 状态：等待确认 / 状态：已确认 / 状态：进行中 / 状态：等待审核 / 状态：准备合并

## 输出 JSON
{"type":"issue或pull_request","summary":"一句话中文总结","rank":"段位名（如 荣耀黄金）","rank_reason":"为什么给这个段位","pros":["优点1"],"cons":["需要改进的地方"],"labels":["标签1","标签2"],"comment":"给作者的审查回复（Markdown，包含段位解释）","should_close":false,"close_reason":""}`;

async function analyzeItem(item) {
  const isPR = !!item.pull_request;
  const title = item.title || "";
  const body = (item.body || "").slice(0, 3000);
  const author = item.user?.login || "未知";
  const labels = (item.labels || []).map((l) => l.name).join(", ") || "无";

  const context = [
    `类型: ${isPR ? "Pull Request" : "Issue"}`,
    `编号: #${item.number}`,
    `标题: ${title}`,
    `作者: @${author}`,
    `当前标签: ${labels}`,
    `创建: ${item.created_at}`,
    `更新: ${item.updated_at}`,
    `内容:\n${body}`,
  ];

  if (isPR) {
    context.push(
      `分支: ${item.head?.ref || "?"} → ${item.base?.ref || "?"}`,
      `文件: ${item.changed_files ?? "?"} | +${item.additions ?? "?"} -${item.deletions ?? "?"}`,
    );
  }

  try {
    const data = callDeepSeek([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context.join("\n\n---\n\n") },
    ]);

    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log(`  ⚠️ AI 输出无法解析: ${content.slice(0, 150)}`);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    log(`  📝 ${result.summary || "?"} | 🏆 ${result.rank || "?"}`);
    return result;
  } catch (e) {
    log(`  ❌ AI 失败: ${e.message}`);
    return null;
  }
}

// ============================================================
// ClawSweeper 风格评论
// ============================================================

const RANK_ICONS = {
  "未定级": "❓", "倔强青铜": "🥉", "秩序白银": "🥈",
  "荣耀黄金": "🥇", "永恒钻石": "💎", "至尊星耀": "🌟", "最强王者": "👑",
};

const RANK_EXPLAIN = {
  "未定级": "信息不足，尚无法评估质量",
  "倔强青铜": "初具雏形，仍需补充大量信息",
  "秩序白银": "基本清晰，可以正常处理",
  "荣耀黄金": "描述完整，质量不错",
  "永恒钻石": "高质量，细节到位",
  "至尊星耀": "非常出色，堪称范例",
  "最强王者": "顶级质量，完美无瑕",
};

function buildAckComment(item) {
  const typeStr = item.pull_request ? "PR" : "Issue";
  return [
    "> 🤖 **ClawSweeper** · 正在查看",
    "",
    `👀 收到 ${typeStr} #${item.number}，正在分析……`,
    "",
    "---",
    "<sub>⚙️ 自动响应 · 分析完成后会更新评论</sub>",
  ].join("\n");
}

function buildReviewComment(item, result) {
  const rank = result.rank || "未定级";
  const icon = RANK_ICONS[rank] || "❓";
  const explain = RANK_EXPLAIN[rank] || "";

  const lines = [
    "> 🤖 **ClawSweeper** · 审查完成",
    "",
    "### 📋 概要",
    result.summary || "(无法总结)",
    "",
  ];

  if (result.pros?.length > 0) {
    lines.push("### ✅ 优点");
    for (const p of result.pros) lines.push(`- ${p}`);
    lines.push("");
  }

  if (result.cons?.length > 0) {
    lines.push("### ⚠️ 需要注意");
    for (const c of result.cons) lines.push(`- ${c}`);
    lines.push("");
  }

  lines.push(
    `### 🏆 段位评定：${icon} ${rank}`,
    "",
    `> **${rank}** — ${explain}`,
    "",
  );
  if (result.rank_reason) lines.push(result.rank_reason, "");

  if (result.labels?.length > 0) {
    lines.push(
      "### 🔖 标签",
      "",
      result.labels.map((l) => `\`${l}\``).join(" "),
      "",
    );
  }

  lines.push(
    "---",
    "<details>",
    "<summary>📊 段位排名简介</summary>",
    "",
    "| 段位 | 含义 |",
    "|------|------|",
    "| 👑 最强王者 | 顶级质量，完美无瑕 |",
    "| 🌟 至尊星耀 | 非常出色，堪称范例 |",
    "| 💎 永恒钻石 | 高质量，细节到位 |",
    "| 🥇 荣耀黄金 | 描述完整，质量不错 |",
    "| 🥈 秩序白银 | 基本清晰，可以正常处理 |",
    "| 🥉 倔强青铜 | 初具雏形，仍需补充 |",
    "| ❓ 未定级 | 信息不足，尚无法评估 |",
    "",
    "</details>",
    "",
    `<sub>🤖 自动生成 · 有疑问请 @LiGuiyu-AI · [标签说明](https://github.com/${CONFIG.REPO}/blob/main/docs/labels.md)</sub>`,
  );

  return lines.join("\n");
}

// ============================================================
// 处理单个 Item（两阶段评论）
// ============================================================

async function processItem(item, reason) {
  const num = item.number;
  const typeStr = item.pull_request ? "PR" : "Issue";

  log(`\n🔍 [${reason}] ${typeStr} #${num}: ${(item.title || "").slice(0, 60)}`);

  // 阶段一：确认评论
  const ackBody = buildAckComment(item);
  const commentId = await postComment(num, ackBody);
  if (commentId) log(`  👀 确认评论已发`);

  // 阶段二：AI 分析
  const result = await analyzeItem(item);
  if (!result) {
    if (commentId) {
      await updateComment(commentId, ackBody.replace("正在分析……", "分析遇到问题，请稍后重试或 @nuaamap-bot"));
    }
    return false;
  }

  // 打标签
  if (result.labels?.length > 0) {
    const existingLabels = (item.labels || []).map((l) => l.name);
    const validNew = result.labels.filter((l) => VALID_LABELS.includes(l));
    await setLabels(num, [...new Set([...existingLabels, ...validNew])]);
    log(`  🏷️ ${validNew.join(", ")}`);
  }

  // 发布完整审查（更新确认评论）
  const reviewBody = buildReviewComment(item, result);
  if (commentId) {
    await updateComment(commentId, reviewBody);
  } else {
    await postComment(num, reviewBody);
  }
  log(`  ✅ 审查完成`);

  return true;
}

// ============================================================
// 增量扫描
// ============================================================

async function sweepIncremental() {
  log("=".repeat(50));
  log("🔍 增量扫描");

  const state = loadState();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 6 * 60 * 1000);

  const allIssues = await ghAPI(
    `/issues?state=open&since=${windowStart.toISOString()}&sort=updated&direction=desc&per_page=30`
  );
  const botLogin = CONFIG.BOT_LOGIN;
  const candidates = allIssues.filter((i) => i.user?.login !== botLogin);

  if (candidates.length === 0) {
    log("  ℹ️ 没有新 Item");
  } else {
    log(`  📋 ${candidates.length} 个候选`);
    let n = 0;
    for (const item of candidates) {
      if (n >= CONFIG.MAX_ITEMS_PER_RUN) break;
      const num = item.number;
      const last = state.reviewed[num];
      const updatedTs = new Date(item.updated_at).getTime();
      if (last && updatedTs <= last.at) continue;

      const createdTs = new Date(item.created_at).getTime();
      const reason = createdTs > windowStart.getTime() ? "新创建" : "有更新";
      await processItem(item, reason);
      state.reviewed[num] = { at: Date.now(), reason };
      n++;
    }
    log(`  ✅ 处理 ${n} 个`);
  }

  await sweepMentions(state, now);
  saveState(state);
}

// ============================================================
// @bot 提及
// ============================================================

async function sweepMentions(state, now = new Date()) {
  log("\n💬 检查 @bot 提及...");

  try {
    const comments = await ghAPI(
      `https://api.github.com/repos/${CONFIG.REPO}/issues/comments?sort=updated&direction=desc&per_page=20`
    );

    const windowStart = now.getTime() - 6 * 60 * 1000;
    let count = 0;

    for (const c of comments) {
      const ct = new Date(c.updated_at).getTime();
      if (ct < windowStart) continue;
      if (c.user?.login === CONFIG.BOT_LOGIN) continue;

      const bodyText = c.body || "";
      const mentioned =
        new RegExp(`@${CONFIG.BOT_LOGIN}\\b`, "i").test(bodyText) ||
        /@bot\b/i.test(bodyText);
      if (!mentioned) continue;

      const num = extractIssueNumber(c.issue_url);
      if (!num) continue;

      const key = `mention_${num}`;
      if (state.reviewed[key] && state.reviewed[key].at >= ct) continue;

      log(`  📣 #${num} 被 @ 提及`);
      try {
        const item = await ghAPI(`/issues/${num}`);
        await processItem(item, "被 @ 提及");
        state.reviewed[key] = { at: now.getTime() };
        count++;
      } catch (e) {
        log(`  ⚠️ #${num}: ${e.message}`);
      }
    }

    if (count === 0) log("  ℹ️ 无新提及");
  } catch (e) {
    log(`  ⚠️ 检查提及失败: ${e.message}`);
  }
}

// ============================================================
// 每日巡检
// ============================================================

async function sweepDaily() {
  log("=".repeat(50));
  log("📅 每日全量巡检");

  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailySweep === today) {
    log("  ℹ️ 今天已跑过");
    return;
  }

  const [issues, prs] = await Promise.all([
    ghAPI("/issues?state=open&per_page=50&sort=updated&direction=desc"),
    ghAPI("/pulls?state=open&per_page=30&sort=updated&direction=desc"),
  ]);

  const botLogin = CONFIG.BOT_LOGIN;
  const allItems = [
    ...issues.filter((i) => !i.pull_request && i.user?.login !== botLogin),
    ...prs.filter((p) => p.user?.login !== botLogin),
  ];

  log(`  📋 ${allItems.length} 个开放 Item`);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let staleN = 0, labelN = 0;

  for (const item of allItems) {
    const existingLabels = (item.labels || []).map((l) => l.name);

    // 缺标签 → 补
    if (!existingLabels.some((l) => VALID_LABELS.includes(l))) {
      const key = `labeled_${item.number}`;
      if (!state.reviewed[key]) {
        log(`  🏷️ #${item.number} 缺标签`);
        const result = await analyzeItem(item);
        if (result?.labels?.length > 0) {
          await setLabels(item.number, [...new Set([...existingLabels, ...result.labels.filter((l) => VALID_LABELS.includes(l))])]);
          labelN++;
        }
        state.reviewed[key] = { at: now };
      }
    }

    // 过时检查
    const age = Math.floor((now - new Date(item.updated_at).getTime()) / DAY);
    if (age >= 60 && existingLabels.length === 0) {
      log(`  🕐 #${item.number} ${age}天 → 过时提醒`);
      await postComment(item.number, [
        "### 🕐 这条 Issue 已经很久没有更新了",
        `最近活动 ${item.updated_at?.slice(0, 10)}（${age} 天前）。`,
        "如果问题还存在说一声就好，Bot 会重新审核～",
      ].join("\n\n"));
      staleN++;
    } else if (age >= 30 && age < 60) {
      const key = `nudge_${item.number}`;
      if (!state.reviewed[key] || now - state.reviewed[key].at > 7 * DAY) {
        log(`  💡 #${item.number} ${age}天 → 友情提醒`);
        await postComment(item.number, `### 💡 友情提醒\n\n这条 Issue 已经 ${age} 天没有更新啦，确认一下问题是否还存在～`);
        state.reviewed[key] = { at: now };
        staleN++;
      }
    }
  }

  state.lastDailySweep = today;
  saveState(state);
  log(`  ✅ 补标签 ${labelN} | 过时处理 ${staleN}`);
}

// ============================================================
// 历史回填：给所有 Issue/PR 打新标签
// ============================================================

async function backfill() {
  log("=".repeat(50));
  log("📦 历史回填模式");

  const state = loadState();
  const now = Date.now();

  log("\n📋 获取所有 Issue...");
  const allIssues = [];
  for (let page = 1; page <= 10; page++) {
    const items = await ghAPI(
      `/issues?state=all&per_page=100&page=${page}&sort=created&direction=asc`
    );
    if (items.length === 0) break;
    allIssues.push(...items.filter((i) => !i.pull_request));
  }

  log("📋 获取所有 PR...");
  const allPRs = [];
  for (let page = 1; page <= 10; page++) {
    const items = await ghAPI(
      `/pulls?state=all&per_page=100&page=${page}&sort=created&direction=asc`
    );
    if (items.length === 0) break;
    allPRs.push(...items);
  }

  const total = allIssues.length + allPRs.length;
  log(`📊 ${allIssues.length} Issue + ${allPRs.length} PR = ${total} 项\n`);

  let processed = 0;
  for (const item of [...allIssues, ...allPRs]) {
    const key = `backfill_${item.number}`;
    if (state.reviewed[key]) continue;

    const typeStr = item.pull_request ? "PR" : "Issue";
    log(`🔍 [回填] ${typeStr} #${item.number}: ${(item.title || "").slice(0, 60)}`);

    const result = await analyzeItem(item);
    if (result?.labels?.length > 0) {
      const validLabels = result.labels.filter((l) => VALID_LABELS.includes(l));
      if (validLabels.length > 0) {
        await setLabels(item.number, validLabels);
        log(`  🏷️ ${validLabels.join(", ")} | 🏆 ${result.rank || "?"}`);
        processed++;
      }
    }

    state.reviewed[key] = { at: now };
    if (processed % 10 === 0) saveState(state);
  }

  saveState(state);
  log(`\n✅ 回填完成: ${processed} 项`);
}

// ============================================================
// 入口
// ============================================================

async function main() {
  if (!CONFIG.GH_TOKEN) {
    log("❌ 缺少 GH_TOKEN");
    process.exit(1);
  }

  await ensureLabelsExist();

  const mode = process.argv[2] || "incremental";
  try {
    if (mode === "daily") { await sweepDaily(); await sweepIncremental(); }
    else if (mode === "backfill") { await backfill(); }
    else { await sweepIncremental(); }
  } catch (e) {
    log(`❌ ${e.message}`);
    process.exit(1);
  }

  log("🏁 完成\n");
}

main();
