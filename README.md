📘 语音拼读背词助手 (Voice Recite App)极简现代风的语音交互式单词记忆应用。听中文说英文，智能识别拼读，让背单词更高效。📖 项目简介本项目是一款基于 React Native (Expo) 开发的英语单词学习应用。应用摒弃了传统的“看词选义”模式，核心采用**“语音拼读”**交互——系统播放中文释义，用户口语拼读单词，通过语音识别（STT）技术判断正误。项目设计遵循极简主义风格，支持 CSV 词库导入、背景音乐伴学、速背模式以及学习数据统计。🎨 设计与 UI 规范应用采用极简现代设计风格，界面清爽，操作直观。色彩体系⚪ 主色 (Primary Background): #FFFFFF (纯白) - 用于页面背景，营造清爽感。🔵 辅色 (Primary/Text): #1A237E (深蓝) - 用于主要文字、标题和核心按钮，体现沉稳专注。🟠 点缀色 (Accent/Feedback): #FFA726 (橙黄) - 用于交互高亮、正确率图表及反馈动画。交互原则圆角卡片: 柔和的圆角设计与阴影，提升视觉舒适度。动效反馈: 拼读正确/错误时提供即时的视觉与听觉反馈。沉浸体验: 全局支持背景音乐（巴洛克/纯音乐），减少外界干扰。✨ 核心功能1. 🔐 身份认证 (Auth)用户登录与注册流程。基于 AuthContext 的全局状态管理。安全的路由保护（未登录自动跳转）。2. 🏠 首页 (Home)仪表盘: 可视化展示今日背词进度（进度条）、正确率及准确率。快捷入口: 快速进入“语音拼读”、“速背模式”。背景音乐: 顶部集成的音乐播放控制，支持播放/暂停伴学音乐。3. 🎙️ 语音拼读练习 (Voice Practice)核心玩法: 听中文释义 -> 语音拼读单词 -> 系统识别 -> 反馈结果。技术实现: 结合 TTS (Text-to-Speech) 播报释义与 STT (Speech-to-Text) 语音转文字。智能纠错: 拼读错误自动加入生词本，正确则移出复习队列。4. ⚡ 速背模式 (Speed Review)单词卡片自动轮播。支持单词发音自动播放。点击遮罩显示/隐藏释义，适合碎片化时间快速复习。5. 📚 词库管理 (Vocabulary)CSV 导入: 支持通过文件管理器导入 .csv 格式词库（格式：单词,释义1,释义2...）。分类管理: 自动解析 CSV 内容并分类。CRUD: 支持查看单词详情及删除单词。6. 👤 个人中心 (Profile)学习数据统计（累计单词、坚持天数）。每日目标设定（10/20/30/50 词）。账号管理与退出登录。🛠 技术栈框架: React Native / Expo SDK 52语言: TypeScript路由: expo-router (文件系统路由)状态管理: React Context API + Hooks (useAuth, useVocabulary, useProgress)数据请求: @tanstack/react-query多媒体:expo-speech: 文本转语音 (TTS)expo-av: 音频录制与播放expo-document-picker: 文件选择react-native-svg: 矢量图形与渐变渲染UI 组件:lucide-react-native: 矢量图标库react-native-reanimated: 动画效果📂 目录结构app/
├── _layout.tsx          # 根布局与 Provider 注入
├── +not-found.tsx       # 404 页面
├── login.tsx            # 登录/注册页
├── practice.tsx         # 语音拼读练习核心页
├── speed-review.tsx     # 速背模式页
└── (tabs)/              # 底部导航栏页面
    ├── _layout.tsx      # Tab 导航配置
    ├── index.tsx        # 首页 (仪表盘)
    ├── vocabulary.tsx   # 词库管理页
    └── profile.tsx      # 个人中心页
components/
└── Gradient.tsx         # 自定义 SVG 渐变组件 (解决 React 19 兼容性)
contexts/                # 全局状态 Context
├── AuthContext.tsx
├── MusicContext.tsx
├── ProgressContext.tsx
└── VocabularyContext.tsx
constants/
└── colors.ts            # 全局颜色定义
types/
└── index.ts             # TypeScript 类型定义
🚀 快速开始环境要求Node.js (推荐 v20 LTS 或 v22 LTS)npm 或 yarn安装依赖# 1. 克隆项目
git clone <repository-url>
cd recite-app

# 2. 安装依赖 (强制解决部分 React 19 依赖冲突)
npm install --legacy-peer-deps

# 3. 安装 Expo CLI (如果尚未安装)
npm install -g expo-cli
运行项目由于涉及原生模块 (录音、文件选择)，建议使用 Expo Go 真机调试或模拟器运行。# 启动开发服务器 (推荐使用隧道模式以避免局域网连接问题)
npx expo start --tunnel --clear
⚠️ 注意事项语音识别 API: app/practice.tsx 中依赖后端接口 https://toolkit.rork.com/stt/transcribe/ 进行音频转文字。请确保该服务可用，或替换为您自己的 STT 服务地址。React 19 兼容性: 当前项目使用了 React 19。由于 expo-linear-gradient 在 React 19 下存在兼容性问题，项目中已使用 react-native-svg 封装的 <Gradient /> 组件替代原生渐变库。录音权限: 在真机运行时，首次进入练习页面需授予麦克风权限。📝 词库导入格式请准备 .csv 文件，格式如下（不包含表头）：apple,苹果,苹果公司
abandon,放弃,遗弃
book,书,预订
