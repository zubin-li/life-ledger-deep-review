# Life Ledger 语音复盘功能技术评估

日期：2026-08-22  
状态：研究结论，不包含代码修改或部署

## 决策摘要

语音复盘适合作为 Life Ledger 的下一项核心功能，但第一版必须聚焦于一个闭环：

> 前台录音 1–5 分钟 → 录完后转写 → AI 去除口语冗余并整理 → 用户编辑确认 → 追加到当天 Daily Reflection。

第一版不建议做实时对话，也不建议让 AI 直接勾选 Habit、修改 Mood 或创建 Goal。后者应在第二阶段以“待确认建议”形式实现。

## 推荐架构

1. 浏览器使用 `getUserMedia` 与 `MediaRecorder` 录音，动态选择 WebM/Opus 或 MP4。
2. 前端将音频上传到受 Cloudflare Access 保护的 `/api/voice-review`。
3. Worker 先调用语音转写模型，再调用文字模型生成结构化草稿。
4. 客户端校验返回结构并显示“原始转写 / 整理稿”。
5. 用户确认后，仅把整理后的文字追加到 `state.logs[date].note`。
6. 音频默认只存在于内存；成功、取消或超时后删除，不进入 localStorage、D1、同步或备份。

## 模型路线

### 推荐默认：Cloudflare Workers AI

- 转写：`@cf/openai/whisper-large-v3-turbo`
- 整理：Cloudflare Workers AI 的多语言指令模型
- 优点：与现有 Cloudflare 架构最匹配，不需要外部 API Key；每日个人使用大概率处于免费额度内。
- 风险：中英德及混合语言的实际质量必须先做真实录音 benchmark；JSON 输出仍需应用层验证。

### 质量备选：OpenAI

- 转写：`gpt-transcribe` 或 `gpt-4o-mini-transcribe`
- 整理：支持 Structured Outputs 的低成本文字模型
- 优点：结构化输出和多语言转写能力强。
- 风险：需要用户单独开通 API 计费；密钥必须保存在 Worker Secret，不能放在浏览器。

### 不作为主路径

- 浏览器 `SpeechRecognition`：兼容性不完整，只适合作为实验降级。
- 浏览器本地 Whisper：模型体积、手机性能和跨设备差异较大，适合作为未来离线实验。
- Realtime 实时转写：成本和状态复杂度明显更高，却没有解决当前核心需求。

## 产品交互

在 Daily Reflection 卡片内增加麦克风入口，不新增主导航页面。

状态流程：

1. 准备录音
2. 正在录音：时长、音量反馈、暂停、结束、取消
3. 正在转写
4. 正在整理
5. 草稿预览：整理稿可编辑，原始转写可折叠查看
6. 保存到今日复盘

已有复盘内容时默认“追加”，绝不静默覆盖。录音失败时保留已有音频分片或原始转写供重试；最终写入前不改变任何状态。

## 第二阶段：结构化建议，而非自动操作

以后可以让 AI 返回 Mood、Habit、今日目标和明日目标建议，但必须采用 JSON Schema、稳定 ID 白名单和逐项确认。AI 输出只能是 proposal，不能直接调用 `toggleHabit()`。

## 当前代码中的关键前置条件

- `public/_headers` 当前包含 `microphone=()`，线上会直接阻止麦克风。实现时需改为仅允许本站，并在真实 HTTPS 域名测试。
- `state.logs[date].note` 已同时驱动 Today 与日历记录，也会自然进入 Review Canvas，因此 V1 无需数据库迁移。
- 当前同步是整个 state 的 last-write-wins。AI 等待期间另一设备可能修改同一天数据；保存前必须重新拉取远端并做字段级合并，长期应增加基于 `updatedAt` 的乐观锁与 `409 Conflict`。
- `public/app.js` 已接近 4,000 行；录音状态机应拆到独立 `voice-checkin.js`，不要继续堆进主文件。
- Worker observability 已启用；语音接口不能记录音频正文、transcript、AI response 或 API Key。

## 成本估算

按每天 5 分钟、每月 150 分钟：

- Cloudflare Whisper：转写标价约 $0.0005/分钟，约 $0.075/月；其每日 10,000 Neurons 免费额度下，单人使用预计通常不产生 AI 推理费用。
- OpenAI `gpt-4o-mini-transcribe`：约 $0.003/分钟，即 $0.45/月；文字整理通常仅增加几美分。
- OpenAI `gpt-transcribe`：约 $0.0045/分钟，即 $0.675/月；文字整理仍是小头。
- OpenAI 实时转写：约 $0.017/分钟，即 $2.55/月，不建议用于 V1。

ChatGPT 订阅与 API 计费彼此独立。以上均为当前公开价格的估算，不含税费、汇率变化和未来调价。

## 部署差异

- 个人 Cloudflare 自托管版：可以完整支持 AI 语音复盘，优先使用 Workers AI binding；如用 OpenAI，Key 放在 Worker Secret。
- GitHub Pages 公开本机版：没有可信后端，不能安全地保存第三方 API Key。应继续支持系统键盘听写，并说明“AI 语音整理需要部署到自己的 Cloudflare”。
- CloudBase 国内版：需要独立的 Cloud Function 与国内可用的 ASR/LLM 适配器，是第二阶段工作，不能假装与 Cloudflare 共用同一套后端。

## 提醒边界

第一版沿用用户自己的日历或闹钟。纯本地 PWA 无法可靠保证应用完全关闭时仍在每日 21:00 精确推送。真正可靠的提醒需要 Push subscription、Service Worker、服务器定时任务和平台授权，应作为独立后续功能。

## 工程量

- 真实语音 benchmark：1–2 个工程日
- 可用 MVP（录音、转写、整理、预览、确认、三语、错误恢复、移动端测试、文档）：7–12 个工程日
- Mood/Habit/Goal 待确认建议：额外 4–7 个工程日
- CloudBase 或多供应商适配：额外 1–2 周
- 可靠后台 Web Push：独立项目，不应与语音 MVP 捆绑

## 推荐实施顺序

1. 用中文、英文、德文及混合语言录音做 1–2 天 benchmark，比较 Cloudflare Whisper 与 OpenAI mini。
2. 若 Cloudflare 质量达到要求，冻结 V1 为 Cloudflare-only；否则选择 OpenAI 作为单一 Provider。
3. 完成 Daily Reflection 单入口 MVP，默认不保存音频，不自动更改结构化数据。
4. 验证两周真实使用价值后，再开发 Mood/Habit/Goal 建议。

最终建议：先做“说完以后得到一篇可信、可编辑的当日复盘”，不要一开始追求“语音控制整个 Life Ledger”。
