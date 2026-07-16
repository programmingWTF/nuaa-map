// NUAAMap AI 维护 Bot
// 部署在 NAS，通过 EasyConnect VPN 代理访问南航 DeepSeek API
// 运行方式: GH_TOKEN=ghp_xxx DEEPSEEK_KEY=sk-xxx ALL_PROXY=socks5h://127.0.0.1:1080 node sweep.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
  BOT_LOGIN: "nuaamap-bot",

  DEEPSEEK_API: "https://token.nuaa.edu.cn/v1/chat/completions",
  DEEPSEEK_MODEL: "deepseek-v4-pro",
  DEEPSEEK_KEY: process.env.DEEPSEEK_KEY || "",

  STATE_FILE: join(__dirname, "state.json"),
  MAX_ITEMS_PER_RUN: 10,
};

// ============================================================
// 工具函数
// ============================================================

function log(...args) {
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  console.log(`[${ts}]`, ...args);
}

function loadState() {
  if (!existsSync(CONFIG.STATE_FILE)) return { reviewed: {}, lastDailySweep: null };
  try { return JSON.parse(readFileSync(CONFIG.STATE_FILE, "utf-8")); }
  catch { return { reviewed: {}, lastDailySweep: null }; }
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

const VALID_LABELS = [
  "小组：①手绘地图", "小组：②交互功能", "小组：③平台搭建",
  "小组：④数据采集", "小组：⑤AI智能体", "小组：⑥坐标标注",
  "类型：Bug", "类型：功能请求", "类型：文档", "类型：问题咨询", "类型：设计优化",
  "优先级：紧急", "优先级：高", "优先级：中", "优先级：低",
  "状态：需要更多信息", "状态：进行中", "状态：等待审核", "状态：已过时",
  "难度：适合新手", "难度：中等", "难度：复杂",
];

async function ensureLabelsExist() {
  try {
    const existing = await ghAPI("/labels?per_page=100");
    const existingNames = new Set(existing.map((l) => l.name));
    const missing = VALID_LABELS.filter((l) => !existingNames.has(l));
    for (const name of missing) {
      // 根据标签类型给颜色
      let color = "CCCCCC";
      if (name.startsWith("小组：")) {
        const colors = { "①手绘地图": "FF6B6B", "②交互功能": "4ECDC4", "③平台搭建": "45B7D1", "④数据采集": "96CEB4", "⑤AI智能体": "DDA0DD", "⑥坐标标注": "F0B27A" };
        color = colors[name.replace("小组：", "")] || "CCCCCC";
      } else if (name.startsWith("类型：")) {
        color = { Bug: "D93F0B", 功能请求: "0E8A16", 文档: "0075CA", 问题咨询: "FBCA04", 设计优化: "C5DEF5" }[name.replace("类型：", "")] || "CCCCCC";
      } else if (name.startsWith("优先级：")) {
        color = { 紧急: "B60205", 高: "E99695", 中: "F9D0C4", 低: "FEF2C0" }[name.replace("优先级：", "")] || "CCCCCC";
      } else if (name.startsWith("状态：")) {
        color = { 需要更多信息: "D4C5F9", 进行中: "0E8A16", 等待审核: "1D76DB", 已过时: "CCCCCC" }[name.replace("状态：", "")] || "CCCCCC";
      } else if (name.startsWith("难度：")) {
        color = { 适合新手: "0E8A16", 中等: "FBCA04", 复杂: "D93F0B" }[name.replace("难度：", "")] || "CCCCCC";
      }
      await ghAPI("/labels", { method: "POST", body: JSON.stringify({ name, color }) });
      log(`  🏷️ 创建标签: ${name}`);
    }
    if (missing.length === 0) log("  ✅ 所有标签已就绪");
  } catch (e) {
    log(`  ⚠️ 标签管理失败: ${e.message}`);
  }
}

// ============================================================
// GitHub 操作
// ============================================================

async function fetchRecentItems(since) {
  const iso = since.toISOString();
  const issues = await ghAPI(
    `/issues?state=open&since=${iso}&sort=updated&direction=desc&per_page=30`
  );
  return issues;
}

async function fetchAllOpen() {
  const [issues, prs] = await Promise.all([
    ghAPI("/issues?state=open&per_page=50&sort=updated&direction=desc"),
    ghAPI("/pulls?state=open&per_page=30&sort=updated&direction=desc"),
  ]);
  return { issues, prs };
}

async function addLabels(issueNumber, labels) {
  if (!labels || labels.length === 0) return true;
  const valid = labels.filter((l) => VALID_LABELS.includes(l));
  if (valid.length === 0) return false;
  try {
    await ghAPI(`/issues/${issueNumber}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels: valid }),
    });
    return true;
  } catch {
    // 静默失败——标签不重要到影响整体
    return false;
  }
}

async function postComment(issueNumber, body) {
  if (!body) return;
  try {
    await ghAPI(`/issues/${issueNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  } catch (e) {
    log(`  ⚠️ 评论失败: ${e.message}`);
  }
}

// ============================================================
// DeepSeek AI 分析
// ============================================================

const SYSTEM_PROMPT = `你是 NUAAMap 项目的 AI 维护助手。你在帮助一个大学生暑期社会实践团队管理 GitHub Issue 和 Pull Request。

## 项目背景
NUAAMap 是南京航空航天大学天目湖校区的智能校园地图网站，技术栈 React + TypeScript + Vite。团队 14 人分 6 个小组，很多人是第一次做项目、第一次用 GitHub。

## 你的行为准则
1. **友善第一**：这是学习项目，不是企业产品。代码风格不好、commit 不规范、英文不够好都完全 OK。
2. **鼓励优先**：先说好的地方，再给建议。用"可以试试"而不是"你应该"。
3. **宽容判断**：只对安全漏洞、功能崩溃、明显违反项目基本规范时才需要严肃提醒。
4. **标签克制**：每次只打 2-3 个最相关的标签，不要贪多。
5. **不要乱关**：除非是广告或无意义内容，否则永远不建议关闭 Issue。

## 团队小组
- ①手绘地图：地图底图、图标、CSS 样式、UI 设计
- ②交互功能：前端交互、地图点击、弹窗、聊天界面
- ③平台搭建：项目配置、构建脚本、部署、CI/CD
- ④数据采集：QA 知识库、建筑信息数据
- ⑤AI智能体：RAG、聊天 API、智能问答
- ⑥坐标标注：数据转换脚本、像素坐标标注

## 输出格式（必须严格遵守）
只返回一行 JSON，不要 markdown 代码块，不要其他任何文字：
{"type":"issue或pull_request或unclear","summary":"一句话中文总结","labels":["标签1","标签2"],"comment":"给作者的回复（中文，Markdown 格式，友好语气）","should_close":false,"close_reason":""}

## 可选标签列表
小组：①手绘地图 / 小组：②交互功能 / 小组：③平台搭建 / 小组：④数据采集 / 小组：⑤AI智能体 / 小组：⑥坐标标注
类型：Bug / 类型：功能请求 / 类型：文档 / 类型：问题咨询 / 类型：设计优化
优先级：紧急 / 优先级：高 / 优先级：中 / 优先级：低
难度：适合新手 / 难度：中等 / 难度：复杂`;

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
    `创建时间: ${item.created_at}`,
    `更新时间: ${item.updated_at}`,
    `内容:\n${body}`,
  ];

  if (isPR) {
    context.push(
      `分支: ${item.head?.ref || "?"} → ${item.base?.ref || "?"}`,
      `修改文件数: ${item.changed_files ?? "?"}`,
    );
  }

  const userMessage = context.join("\n\n---\n\n");

  try {
    const res = await fetch(CONFIG.DEEPSEEK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log(`  ⚠️ AI 输出无法解析: ${content.slice(0, 150)}`);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    log(`  📝 ${result.summary || "(无总结)"}`);
    return result;
  } catch (e) {
    log(`  ❌ AI 失败: ${e.message}`);
    return null;
  }
}

// ============================================================
// 处理单个 Item
// ============================================================

async function processItem(item, reason) {
  const num = item.number;
  const isPR = !!item.pull_request;
  const typeStr = isPR ? "PR" : "Issue";

  log(`\n🔍 [${reason}] ${typeStr} #${num}: ${(item.title || "").slice(0, 60)}`);

  const result = await analyzeItem(item);
  if (!result) return false;

  // 添加标签
  if (result.labels?.length > 0) {
    const ok = await addLabels(num, result.labels);
    if (ok) log(`  🏷️ ${result.labels.join(", ")}`);
  }

  // 发布评论
  if (result.comment) {
    const emoji = isPR ? "🔀" : "📋";
    const fullComment = [
      `> ${emoji} **AI 维护助手** · ${reason}`,
      "",
      result.comment,
      "",
      "---",
      `<sub>🤖 自动生成 · 有疑问请评论 @bot · [项目主页](https://github.com/${CONFIG.REPO})</sub>`,
    ].join("\n");
    await postComment(num, fullComment);
  }

  return true;
}

// ============================================================
// 扫描：新创建+更新
// ============================================================

async function sweepIncremental() {
  log("=".repeat(50));
  log("🔍 增量扫描");

  const state = loadState();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 6 * 60 * 1000); // 过去 6 分钟

  const allIssues = await fetchRecentItems(windowStart);
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
      // 跳过刚审核过的
      if (last && updatedTs <= last.at) continue;

      const createdTs = new Date(item.created_at).getTime();
      const reason = createdTs > windowStart.getTime() ? "新创建" : "有更新";
      await processItem(item, reason);
      state.reviewed[num] = { at: Date.now(), reason };
      n++;
    }
    log(`  ✅ 处理 ${n} 个`);
  }

  // @ 提及
  await sweepMentions(state, now);
  saveState(state);
}

// ============================================================
// 扫描：@bot 提及
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

      const body = c.body || "";
      const mentioned =
        new RegExp(`@${CONFIG.BOT_LOGIN}\\b`, "i").test(body) ||
        /@bot\b/i.test(body);
      if (!mentioned) continue;

      const num = extractIssueNumber(c.issue_url);
      if (!num) continue;

      const key = `mention_${num}`;
      if (state.reviewed[key] && state.reviewed[key].at >= ct) continue;

      log(`  📣 #${num} 被 @ 提及`);

      try {
        const item = await ghAPI(`/issues/${num}`);
        await processItem(item, "被 @ 提及重新审核");
        state.reviewed[key] = { at: now.getTime() };
        count++;
      } catch (e) {
        log(`  ⚠️ 处理 #${num} 失败: ${e.message}`);
      }
    }

    if (count === 0) log("  ℹ️ 无新提及");
  } catch (e) {
    log(`  ⚠️ 检查提及失败: ${e.message}`);
  }
}

// ============================================================
// 每日全量巡检
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

  const { issues, prs } = await fetchAllOpen();
  const botLogin = CONFIG.BOT_LOGIN;
  const allItems = [
    ...issues.filter((i) => !i.pull_request && i.user?.login !== botLogin),
    ...prs.filter((p) => p.user?.login !== botLogin),
  ];

  log(`  📋 ${allItems.length} 个开放 Issue/PR`);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let staleN = 0;

  for (const item of allItems) {
    const updated = new Date(item.updated_at).getTime();
    const age = Math.floor((now - updated) / DAY);

    if (age >= 60 && (item.labels || []).length === 0) {
      // 60 天+无标签 → 标记过时
      log(`  🕐 #${item.number} ${age}天未更新 | 无标签 → 标记过时`);
      await addLabels(item.number, ["状态：已过时"]);
      await postComment(item.number, [
        "### 🕐 这条 Issue 已经很久没有更新了",
        "",
        `创建于 ${item.created_at?.slice(0, 10)}，最近活动 ${item.updated_at?.slice(0, 10)}（${age} 天前）。`,
        "",
        "如果问题还存在，评论里说一声就好，Bot 会重新审核。如果不再需要，直接关闭即可～",
      ].join("\n"));
      staleN++;
    } else if (age >= 30 && age < 60) {
      // 30 天 → 温和提醒（7 天内不重复）
      const key = `nudge_${item.number}`;
      if (!state.reviewed[key] || now - state.reviewed[key].at > 7 * DAY) {
        log(`  💡 #${item.number} ${age}天未更新 → 友情提醒`);
        await postComment(item.number, [
          "### 💡 友情提醒",
          "",
          `这条 Issue 已经 ${age} 天没有更新啦。没有催促的意思～只是确认一下问题是否还存在、是否还有计划做？`,
          "",
          "不用回复也没关系！",
        ].join("\n"));
        state.reviewed[key] = { at: now };
        staleN++;
      }
    }
  }

  state.lastDailySweep = today;
  saveState(state);
  log(`  ✅ 处理 ${staleN} 个过时项`);
}

// ============================================================
// 入口
// ============================================================

async function main() {
  if (!CONFIG.GH_TOKEN) {
    log("❌ 缺少 GH_TOKEN 环境变量");
    log("   用法: GH_TOKEN=ghp_xxx ALL_PROXY=socks5h://127.0.0.1:1080 node sweep.mjs [daily]");
    process.exit(1);
  }

  // 确保标签存在（首次运行创建）
  await ensureLabelsExist();

  const mode = process.argv[2] || "incremental";
  try {
    if (mode === "daily") {
      await sweepDaily();
      await sweepIncremental();
    } else {
      await sweepIncremental();
    }
  } catch (e) {
    log(`❌ 运行出错: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }

  log("🏁 完成\n");
}

main();
