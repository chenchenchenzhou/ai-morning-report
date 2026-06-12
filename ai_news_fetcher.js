/**
 * AI新闻晨间报告采集器 v4 (全源版)
 * 
 * 数据源分类：
 * 🧩 Claude/Anthropic  |  ⚡ Codex/OpenAI  |  🎓 AI博主/官方  |  📺 YouTube
 * 🌐 国际权威           |  🇨🇳 国内权威      |  🔧 技巧教程     |  💬 社区
 */
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const REPORT_FILE = path.join(__dirname, "AI晨报.html");
const MAX = 5;
const TIMEOUT = 8000;

// ========== 全部数据源 ==========
const SOURCES = [
  // ===== 🧩 Claude / Anthropic =====
  { name: "Anthropic 研究博客", url: "https://www.anthropic.com/research/feed", cat: "🧩 Claude / Anthropic", pri: 1 },
  { name: "Claude News (Google)", url: "https://news.google.com/rss/search?q=%22claude+code%22+OR+%22claude+sonnet%22+OR+anthropic+AI&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", cat: "🧩 Claude / Anthropic", pri: 1 },
  { name: "Claude 用法技巧 (Google)", url: "https://news.google.com/rss/search?q=%22claude+code%22+tips+tutorial+OR+%22how+to+use+claude%22&hl=en-US&gl=US&ceid=US:en", cat: "🧩 Claude / Anthropic", pri: 1 },

  // ===== ⚡ Codex / OpenAI =====
  { name: "OpenAI 官方博客", url: "https://openai.com/blog/rss.xml", cat: "⚡ Codex / OpenAI", pri: 1 },
  { name: "Codex News (Google)", url: "https://news.google.com/rss/search?q=%22openai+codex%22+OR+%22codex+cli%22+OR+openai+gpt-5&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", cat: "⚡ Codex / OpenAI", pri: 1 },
  { name: "Codex 技巧教程 (Google)", url: "https://news.google.com/rss/search?q=%22codex+cli%22+tips+tutorial+OR+%22how+to+use+codex%22&hl=en-US&gl=US&ceid=US:en", cat: "⚡ Codex / OpenAI", pri: 1 },

  // ===== 🎓 AI博主/官方人物 =====
  { name: "Simon Willison (AI博主)", url: "https://simonwillison.net/atom/everything/", cat: "🎓 AI博主/官方", pri: 1 },
  { name: "Andrej Karpathy 博客", url: "https://karpathy.github.io/feed.xml", cat: "🎓 AI博主/官方", pri: 1 },
  { name: "AI博主动态 (Google)", url: "https://news.google.com/rss/search?q=Andrej+Karpathy+OR+%22Simon+Willison%22+OR+%22Sam+Altman%22+OR+%22Dario+Amodei%22+OR+%22Yann+LeCun%22+AI&hl=en-US&gl=US&ceid=US:en", cat: "🎓 AI博主/官方", pri: 1 },
  { name: "AI领袖动态中文 (Google)", url: "https://news.google.com/rss/search?q=Sam+Altman+OR+Dario+Amodei+OR+Demis+Hassabis+OR+%E6%9D%8E%E9%A3%9E%E9%A3%9E+OR+Ilya+Sutskever+AI&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", cat: "🎓 AI博主/官方", pri: 2 },

  // ===== 📺 YouTube =====
  { name: "YouTube: Fireship (AI编程)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsBjURrPoezykLs9EqgamOA", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube: Matt Wolfe (AI资讯)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCJtvl1C8dYUJh-HPRKWgX8w", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube: AI Explained", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube: Two Minute Papers", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube: Yannic Kilcher", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube: ByCloudAI", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBDqVMW2HbGArPhVgkzBluQ", cat: "📺 YouTube", pri: 2 },
  { name: "YouTube AI搜索 (Google)", url: "https://news.google.com/rss/search?q=AI+tutorial+OR+%22claude+code%22+OR+%22codex+cli%22+youtube&hl=en-US&gl=US&ceid=US:en", cat: "📺 YouTube", pri: 3 },

  // ===== 🌐 国际权威AI媒体 =====
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", cat: "🌐 国际权威", pri: 2 },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", cat: "🌐 国际权威", pri: 2 },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", cat: "🌐 国际权威", pri: 2 },
  { name: "ArXiv AI论文", url: "https://rss.arxiv.org/rss/cs.AI", cat: "🌐 国际权威", pri: 3 },
  { name: "DeepMind 博客", url: "https://deepmind.google/blog/feed/", cat: "🌐 国际权威", pri: 2 },
  { name: "Meta AI 博客", url: "https://ai.meta.com/blog/feed/", cat: "🌐 国际权威", pri: 2 },
  { name: "GitHub Blog (AI)", url: "https://github.blog/feed/", cat: "🌐 国际权威", pri: 2 },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", cat: "🌐 国际权威", pri: 3 },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/ai", cat: "🌐 国际权威", pri: 3 },
  { name: "国际AI综合 (Google)", url: "https://news.google.com/rss/search?q=artificial+intelligence+breakthrough+OR+AI+research+OR+LLM&hl=en-US&gl=US&ceid=US:en", cat: "🌐 国际权威", pri: 3 },

  // ===== 🇨🇳 国内权威AI媒体 =====
  { name: "机器之心", url: "https://www.jiqizhixin.com/rss", cat: "🇨🇳 国内权威", pri: 2 },
  { name: "量子位", url: "https://www.qbitai.com/feed", cat: "🇨🇳 国内权威", pri: 2 },
  { name: "36氪 AI频道", url: "https://36kr.com/feed?cid=119", cat: "🇨🇳 国内权威", pri: 2 },
  { name: "国内AI综合 (Google)", url: "https://news.google.com/rss/search?q=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD+OR+%E5%A4%A7%E6%A8%A1%E5%9E%8B+OR+AI+%E6%9C%BA%E5%99%A8%E5%AD%A6%E4%B9%A0&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", cat: "🇨🇳 国内权威", pri: 2 },
  { name: "AI工具中文 (Google)", url: "https://news.google.com/rss/search?q=AI%E5%B7%A5%E5%85%B7+OR+AI%E7%BC%96%E7%A8%8B+OR+copilot+OR+cursor&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", cat: "🇨🇳 国内权威", pri: 3 },

  // ===== 🔧 Codex/Claude Code 技巧教程 =====
  { name: "Claude Code 技巧", url: "https://news.google.com/rss/search?q=%22claude+code%22+tips+tricks+%22how+to%22+tutorial+guide&hl=en-US&gl=US&ceid=US:en", cat: "🔧 技巧教程", pri: 1 },
  { name: "Codex CLI 教程", url: "https://news.google.com/rss/search?q=%22codex+cli%22+tutorial+guide+%22how+to+use%22+tips&hl=en-US&gl=US&ceid=US:en", cat: "🔧 技巧教程", pri: 1 },
  { name: "AI编程工具对比", url: "https://news.google.com/rss/search?q=%22claude+code%22+vs+%22codex%22+OR+copilot+OR+cursor+comparison&hl=en-US&gl=US&ceid=US:en", cat: "🔧 技巧教程", pri: 2 },
  { name: "AI Coding 技巧", url: "https://news.google.com/rss/search?q=AI+coding+assistant+tips+%22best+practices%22+OR+workflow+OR+prompt+engineering&hl=en-US&gl=US&ceid=US:en", cat: "🔧 技巧教程", pri: 2 },

  // ===== 💬 社区讨论 =====
  { name: "Hacker News AI", url: "https://hnrss.org/frontpage?q=claude+OR+codex+OR+llm+OR+gpt+OR+openai+OR+anthropic", cat: "💬 社区讨论", pri: 3 },
  { name: "Reddit ML", url: "https://www.reddit.com/r/MachineLearning/.rss", cat: "💬 社区讨论", pri: 3 },
  { name: "Reddit Claude", url: "https://www.reddit.com/r/ClaudeAI/.rss", cat: "💬 社区讨论", pri: 2 },
];

// ========== 关键词标签 ==========
const KEYWORDS = {
  claude:    /\b(claude|anthropic|sonnet|haiku|opus|MCP)\b/i,
  codex:     /\b(code|codex[ -]?cli|openai codex|gpt-5|codestral)\b/i,
  llm:       /\b(llm|大模型|large language model|gpt-5|gpt-4|gemini|llama|mistral|qwen|deepseek|gemma)\b/i,
  tools:     /\b(copilot|cursor|windsurf|aide|v0|bolt|lovable|replit|devin|codebuddy|cline|continue)\b/i,
  youtube:   /\b(youtube|video|tutorial|教程|how.to|guide)\b/i,
  tips:      /\b(tip|trick|hack|secret|best.practice|技巧|秘诀|教程|指南|攻略)\b/i,
  china:     /[\u4e00-\u9fff]{6}/,
};

// ========== 网络请求 ==========
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: TIMEOUT, headers: { "User-Agent": "Mozilla/5.0 (compatible; AIMorningReport/4.0)", "Accept": "application/rss+xml, application/xml, text/xml, */*" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return fetchUrl(res.headers.location).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      let data = ""; res.on("data", c => data += c); res.on("end", () => resolve(data));
    });
    req.on("error", reject); req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

// ========== RSS/Atom 解析 ==========
function parseFeed(xml) {
  const items = [];
  const isRSS = xml.includes("<item>");
  const re = isRSS ? /<item>([\s\S]*?)<\/item>/gi : /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const bx = m[1];
    const g = (t) => { const r = bx.match(new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">", "i")); return r ? clean(r[1]) : ""; };
    const title = g("title");
    const link = isRSS ? g("link") : (bx.match(/<link[^>]*href="([^"]*)"/i) || [,""])[1] || g("link");
    const desc = clean((g("description") || g("summary") || g("content")).substring(0, 400));
    const date = g("pubDate") || g("dc:date") || g("published") || g("updated");
    if (title && title.length > 3) items.push({ title: clean(title), link, desc, date });
  }
  return items;
}
function clean(s) { return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim(); }

// ========== 智能标签 ==========
function tagArticle(item) {
  const text = item.title + " " + item.desc;
  const tags = [];
  if (KEYWORDS.claude.test(text)) tags.push("🤖 Claude");
  if (KEYWORDS.codex.test(text)) tags.push("⚡ Codex");
  if (KEYWORDS.llm.test(text)) tags.push("🧠 大模型");
  if (KEYWORDS.tools.test(text)) tags.push("🔧 AI工具");
  if (KEYWORDS.youtube.test(text)) tags.push("🎬 视频");
  if (KEYWORDS.tips.test(text)) tags.push("💡 技巧");
  return tags;
}

function parseDate(s) { if (!s) return new Date(0); const d = new Date(s); return isNaN(d.getTime()) ? new Date(0) : d; }

// ========== 主流程 ==========
async function main() {
  const now = new Date();
  const ds = now.getFullYear() + "年" + (now.getMonth()+1) + "月" + now.getDate() + "日";
  const wd = "星期" + ["日","一","二","三","四","五","六"][now.getDay()];
  console.log("\n".padEnd(2) + "📰 AI晨报 v4 - " + ds + " " + wd);
  console.log("=".repeat(60));
  console.log("📡 数据源: " + SOURCES.length + " 个\n");

  const all = [];
  let success = 0, fail = 0;

  // 串行抓取，每5个打印一次进度
  for (let i = 0; i < SOURCES.length; i++) {
    const src = SOURCES[i];
    try {
      const xml = await fetchUrl(src.url);
      let items = parseFeed(xml);
      const isGoogle = src.url.includes("news.google.com");
      // Google News 不过滤日期（它返回的都是近期内容）
      if (!isGoogle) items = items.filter(it => parseDate(it.date).getTime() > Date.now() - 5*86400000);
      items = items.slice(0, MAX);
      
      if (items.length > 0) {
        for (const item of items) {
          item.sourceName = src.name; item.cat = src.cat; item.pri = src.pri; item.tags = tagArticle(item);
          all.push(item);
        }
      }
      console.log("  ✅ " + src.name.padEnd(22) + " → " + String(items.length).padStart(2) + "条");
      success++;
    } catch (e) {
      console.log("  ⚠️ " + src.name.padEnd(22) + " → " + e.message.substring(0, 30));
      fail++;
    }
  }

  // 去重
  const seen = new Set();
  const deduped = all.filter(i => {
    const k = i.title.substring(0, 60).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
    if (seen.has(k)) return false; seen.add(k); return true;
  });
  deduped.sort((a, b) => (a.pri||99) - (b.pri||99));

  console.log("\n" + "=".repeat(60));
  console.log("📊 总计: " + deduped.length + " 条 | ✅ " + success + " 源 | ⚠️ " + fail + " 源\n");

  const html = renderHTML(deduped, ds, wd, success, fail);
  fs.writeFileSync(REPORT_FILE, html, "utf-8");
  console.log("✅ 报告: " + REPORT_FILE + "\n");
  try { require("child_process").execSync('start "" "' + REPORT_FILE + '"', { shell: true }); } catch(e) {}
}

// ========== HTML渲染 ==========
function renderHTML(arts, ds, wd, ok, fail) {
  const cats = [
    ["🧩 Claude / Anthropic", "Claude/Anthropic动态"],
    ["⚡ Codex / OpenAI", "Codex/OpenAI动态"],
    ["🎓 AI博主/官方", "AI博主/官方人物动态"],
    ["📺 YouTube", "YouTube AI视频"],
    ["🔧 技巧教程", "Codex & Claude Code技巧教程"],
    ["🌐 国际权威", "国际权威AI媒体"],
    ["🇨🇳 国内权威", "国内权威AI媒体"],
    ["💬 社区讨论", "社区热议"]
  ];
  const groups = {}; cats.forEach(c => groups[c[0]] = []);
  arts.forEach(i => { if (groups[i.cat]) groups[i.cat].push(i); else (groups["🌐 国际权威"] = groups["🌐 国际权威"] || []).push(i); });

  const cnt = re => arts.filter(a => a.tags.some(t => re.test(t))).length;
  const stats = {
    total: arts.length, claude: cnt(/Claude/), codex: cnt(/Codex/), llm: cnt(/大模型/),
    tools: cnt(/工具/), video: cnt(/视频/), tips: cnt(/技巧/)
  };

  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  const rel = s => { const d = parseDate(s); const h = Math.floor((Date.now()-d)/3600000); if (isNaN(h)||h<0) return ""; if (h<1) return Math.floor((Date.now()-d)/60000)+"m前"; if (h<24) return h+"h前"; const dd=Math.floor(h/24); return dd===1?"昨天":dd<7?dd+"天前":d.toLocaleDateString("zh-CN"); };

  const sec = (key) => {
    const items = groups[key];
    if (!items || !items.length) return "";
    const lis = items.map(i => 
      '<div class="a"><div class="at"><a href="' + esc(i.link||"#") + '" target="_blank" rel="noopener">' + esc(i.title) + '</a> ' + 
      (i.tags||[]).map(t => '<span class="tag">'+t+'</span>').join(" ") + '</div>' +
      '<div class="am">📎 ' + esc(i.sourceName) + (i.date?' · '+rel(i.date):'') + '</div>' +
      (i.desc?'<div class="ad">'+esc(i.desc.substring(0,180))+'...</div>':'') + '</div>'
    ).join("\n");
    const names = { "🧩 Claude / Anthropic": "🧩", "⚡ Codex / OpenAI": "⚡", "🎓 AI博主/官方": "🎓", "📺 YouTube": "📺", "🔧 技巧教程": "🔧", "🌐 国际权威": "🌐", "🇨🇳 国内权威": "🇨🇳", "💬 社区讨论": "💬" };
    return '<div class="sec"><h2>' + names[key] + ' ' + key.replace(/^./, '') + ' <span class="cnt">(' + items.length + '篇)</span></h2>\n' + lis + '\n</div>';
  };

  const sections = cats.map(c => sec(c[0])).join("\n");

  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>AI晨报 - ' + ds + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);min-height:100vh;color:#e0e0e0;padding:20px}.c{max-width:960px;margin:0 auto}.h{text-align:center;padding:40px 20px 30px;border-bottom:2px solid rgba(255,255,255,.1);margin-bottom:30px}.h h1{font-size:2.5em;background:linear-gradient(90deg,#00d2ff,#928DAB,#7b2ff7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px}.h .date{font-size:1.2em;color:#928DAB}.h .meta{font-size:.85em;color:#666;margin-top:8px}.stats{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:20px}.st{background:rgba(255,255,255,.08);border-radius:12px;padding:10px 18px;text-align:center;min-width:80px}.st .n{font-size:1.6em;font-weight:bold;color:#00d2ff}.st .l{font-size:.8em;color:#928DAB;margin-top:4px}.st.hl{background:rgba(123,47,247,.15);border:1px solid rgba(123,47,247,.3)}.st.hl .n{color:#7b2ff7}.sec{background:rgba(255,255,255,.05);border-radius:16px;padding:24px;margin-bottom:20px;border:1px solid rgba(255,255,255,.06)}.sec h2{font-size:1.2em;margin-bottom:16px;color:#e0e0e0}.sec .cnt{font-size:.7em;color:#928DAB;font-weight:400}.a{padding:12px 16px;border-left:3px solid rgba(0,210,255,.3);margin-bottom:10px;background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;transition:border-color .2s,background .2s}.a:hover{border-left-color:#00d2ff;background:rgba(255,255,255,.06)}.at{font-size:1.05em;margin-bottom:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.at a{color:#e0e0e0;text-decoration:none}.at a:hover{color:#00d2ff}.tag{font-size:.7em;padding:2px 8px;border-radius:10px;background:rgba(0,210,255,.15);color:#00d2ff;white-space:nowrap}.tag.tip{background:rgba(255,200,0,.15);color:#ffc800}.tag.vid{background:rgba(255,80,80,.15);color:#ff5050}.am{font-size:.8em;color:#928DAB}.ad{font-size:.85em;color:#999;margin-top:6px;line-height:1.5}.toc{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px}.toc a{color:#928DAB;text-decoration:none;font-size:.85em;padding:4px 12px;background:rgba(255,255,255,.05);border-radius:20px;transition:all .2s}.toc a:hover{background:rgba(0,210,255,.15);color:#00d2ff}.f{text-align:center;padding:30px;color:#666;font-size:.85em}@media(max-width:600px){.h h1{font-size:1.8em}.stats{gap:8px}.st{min-width:60px;padding:8px 12px}.st .n{font-size:1.3em}}</style></head><body><div class="c"><div class="h"><h1>🤖 AI 晨间速报 v4</h1><div class="date">' + ds + ' ' + wd + '</div><div class="meta">📡 ' + ok + '/' + (ok+fail) + ' 源成功 · ' + new Date().toLocaleTimeString("zh-CN") + '</div><div class="stats"><div class="st"><div class="n">' + stats.total + '</div><div class="l">总新闻</div></div><div class="st"><div class="n">' + stats.claude + '</div><div class="l">🤖 Claude</div></div><div class="st"><div class="n">' + stats.codex + '</div><div class="l">⚡ Codex</div></div><div class="st"><div class="n">' + stats.llm + '</div><div class="l">🧠 大模型</div></div><div class="st"><div class="n">' + stats.tools + '</div><div class="l">🔧 工具</div></div><div class="st hl"><div class="n">' + stats.tips + '</div><div class="l">💡 技巧</div></div><div class="st"><div class="n">' + stats.video + '</div><div class="l">🎬 视频</div></div></div></div>\n' + (arts.length===0?'<div style="text-align:center;padding:40px;color:#928DAB">📭 今日暂无新消息<br><small>网络暂时不通，脚本会在定时任务中自动重试</small></div>':'') + '\n' + sections + '\n<div class="f"><p>📅 周一至周五自动生成 · AI晨报 v4</p><p>' + new Date().toLocaleString("zh-CN") + '</p><p>博主: Andrej Karpathy · Simon Willison · Sam Altman · Dario Amodei | YouTube: Fireship · Matt Wolfe · AI Explained · 2MinPapers · Yannic Kilcher · ByCloudAI | 国内: 机器之心 · 量子位 · 36氪 | 国际: TechCrunch · MIT TR · The Verge · DeepMind · Meta AI · Wired · Ars Technica</p></div></div></body></html>';
}

main().catch(e => { console.error("❌", e.message); try { fs.writeFileSync(REPORT_FILE, '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>AI晨报</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#1a1a2e;color:#e0e0e0}.err{color:#ff6b6b}</style></head><body><h1>🤖 AI晨报</h1><p class="err">采集遇到问题: ' + e.message + '</p><p>网络暂时不可用，定时任务下次会自动重试</p></body></html>', "utf-8"); } catch(_){} });
