<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from "vue"
import { chatStream } from "@/serve/chat/chat"

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
  isStreaming?: boolean
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'deepseek_conversations'

const loadConversations = (): Conversation[] => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] }
  catch { return [] }
}
const saveConversations = (list: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const conversations = ref<Conversation[]>(loadConversations())
const currentConvId = ref<string>('')
const searchKeyword = ref('')

const currentConv = computed(() =>
  conversations.value.find(c => c.id === currentConvId.value) || null
)
const messages = computed(() => currentConv.value?.messages || [])
const isEmpty = computed(() => !currentConvId.value || messages.value.length === 0)

const filteredConversations = computed(() => {
  if (!searchKeyword.value.trim()) return conversations.value
  const kw = searchKeyword.value.toLowerCase()
  return conversations.value.filter(c => c.title.toLowerCase().includes(kw))
})

const createNewConv = () => {
  const now = new Date()
  const conv: Conversation = {
    id: `conv_${Date.now()}`,
    title: '新对话',
    messages: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
  conversations.value.unshift(conv)
  saveConversations(conversations.value)
  currentConvId.value = conv.id
  searchKeyword.value = ''
  nextTick(() => inputRef.value?.focus())
}

const switchConv = (id: string) => { currentConvId.value = id }

const deleteConv = (id: string, e: Event) => {
  e.stopPropagation()
  conversations.value = conversations.value.filter(c => c.id !== id)
  saveConversations(conversations.value)
  if (currentConvId.value === id) {
    currentConvId.value = conversations.value[0]?.id || ''
  }
}

const updateConvTitle = () => {
  const conv = currentConv.value
  if (!conv || conv.title !== '新对话') return
  const firstUserMsg = conv.messages.find(m => m.role === 'user')
  if (firstUserMsg) {
    conv.title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '…' : '')
    conv.updatedAt = new Date().toISOString()
    saveConversations(conversations.value)
  }
}

const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const send = async (msg?: string) => {
  const content = (msg || userInput.value).trim()
  if (!content || isLoading.value) return

  if (!currentConvId.value) createNewConv()
  const conv = currentConv.value
  if (!conv) return

  const userMsg: ChatMessage = {
    id: `u_${Date.now()}`, role: 'user', content, time: formatTime(),
  }
  conv.messages.push(userMsg)
  conv.updatedAt = new Date().toISOString()
  saveConversations(conversations.value)
  userInput.value = ''
  await scrollToBottom()

  const aiMsgId = `a_${Date.now()}`
  const aiMsg: ChatMessage = {
    id: aiMsgId, role: 'ai', content: '', time: formatTime(), isStreaming: true,
  }
  conv.messages.push(aiMsg)
  await scrollToBottom()
  isLoading.value = true

  const history = conv.messages
    .filter(m => m.id !== aiMsgId && m.content)
    .map(m => ({ role: m.role, content: m.content }))

  await chatStream(
    content,
    (chunk: string) => {
      const m = conv.messages.find(x => x.id === aiMsgId)
      if (m) { m.content += chunk; scrollToBottom() }
    },
    (_full: string) => {
      const m = conv.messages.find(x => x.id === aiMsgId)
      if (m) m.isStreaming = false
      isLoading.value = false
      conv.updatedAt = new Date().toISOString()
      saveConversations(conversations.value)
      updateConvTitle()
      scrollToBottom()
    },
    (error: Error) => {
      const m = conv.messages.find(x => x.id === aiMsgId)
      if (m) { m.content = `❌ 错误: ${error.message}`; m.isStreaming = false }
      isLoading.value = false
    }
  )
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

const quickQuestions = ['帮我写一份产品推广方案', '解释一下机器学习的基本原理', '如何优化团队协作效率？', '分析当前互联网行业趋势']

onMounted(() => {
  if (conversations.value.length > 0) currentConvId.value = conversations.value[0].id
})
</script>

<template>
  <div class="chat-layout">

    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <svg class="sidebar-logo" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#g1)"/>
            <path d="M10 14a4 4 0 1 1 8 0 4 4 0 0 1-8 0zM18 22a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" fill="#fff" opacity=".9"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="36" y2="36"><stop stop-color="#42a5f5"/><stop offset="1" stop-color="#1e88e5"/></linearGradient></defs>
          </svg>
          <div>
            <h3>RAG 智能问答</h3>
            <p>Powered by AI</p>
          </div>
        </div>
      </div>

      <button class="sidebar-new-btn" @click="createNewConv">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新建对话 从头开始
      </button>

      <div class="sidebar-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#90a4ae" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="searchKeyword" type="text" placeholder="搜索对话…"/>
      </div>

      <div class="sidebar-list">
        <div
          v-for="conv in filteredConversations" :key="conv.id"
          :class="['sidebar-item', { active: conv.id === currentConvId }]"
          @click="switchConv(conv.id)"
        >
          <div class="sidebar-item-content">
            <span class="sidebar-item-title">{{ conv.title }}</span>
            <span class="sidebar-item-time">{{ conv.updatedAt.slice(5,10) }} {{ conv.updatedAt.slice(11,16) }}</span>
          </div>
          <button class="sidebar-item-del" @click="deleteConv(conv.id, $event)" title="删除">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div v-if="filteredConversations.length === 0 && searchKeyword" class="sidebar-empty">未找到匹配的对话</div>
      </div>
    </aside>

    <main class="chat-main">

      <template v-if="isEmpty">
        <div class="welcome-zone">
          <div class="welcome-body">
            <h1 class="welcome-title">把问题变成清晰答案</h1>
            <p class="welcome-desc">结构化提问，知识检索与深度思考，一次性输出你所需方案</p>

            <div class="welcome-search">
              <input ref="inputRef" v-model="userInput" type="text"
                placeholder="输入简要要问的内容/问题…"
                @keydown="handleKeydown" :disabled="isLoading"/>
              <button class="welcome-search-btn" @click="send()" :disabled="!userInput.trim() || isLoading">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div class="quick-tags">
              <span v-for="q in quickQuestions" :key="q" class="quick-tag" @click="send(q)">{{ q }}</span>
            </div>

            <div class="feature-row">
              <div class="feature-card">
                <div class="fc-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" stroke-width="1.8">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h4>资料检索</h4>
                <p>快速获取精准答案</p>
              </div>
              <div class="feature-card">
                <div class="fc-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" stroke-width="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <h4>高效交互</h4>
                <p>流式响应实时对话</p>
              </div>
              <div class="feature-card">
                <div class="fc-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" stroke-width="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h4>业务场景</h4>
                <p>深度推理方案落地</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 对话状态 -->
      <template v-else>
        <header class="chat-topbar">
          <span class="topbar-title">{{ currentConv?.title || '对话' }}</span>
          <span class="topbar-hint" v-if="isLoading">AI 回复中…</span>
        </header>

        <div class="chat-messages" ref="messagesContainer">
          <div v-for="msg in messages" :key="msg.id"
            :class="['msg-row', msg.role === 'user' ? 'msg-user' : 'msg-ai']">
            <div v-if="msg.role === 'ai'" class="msg-avatar ai-avatar">
              <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#g2)"/>
                <circle cx="13" cy="15" r="3" fill="#fff"/><circle cx="23" cy="15" r="3" fill="#fff"/>
                <path d="M12 24c2-3 5-4 6-4s4 1 6 4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="36" y2="36"><stop stop-color="#42a5f5"/><stop offset="1" stop-color="#1e88e5"/></linearGradient></defs>
              </svg>
            </div>
            <div class="msg-bubble">
              <div class="msg-text">{{ msg.content }}</div>
              <div v-if="msg.isStreaming" class="msg-typing"><span></span><span></span><span></span></div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
            <div v-if="msg.role === 'user'" class="msg-avatar user-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="chat-input-bar">
          <div class="input-bar-box">
            <input ref="inputRef" v-model="userInput" type="text"
              placeholder="输入消息，Enter 发送…" @keydown="handleKeydown" :disabled="isLoading"/>
            <button class="input-send-btn" @click="send()" :disabled="!userInput.trim() || isLoading">
              <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20v-6l8-2-8-2V4l18 8z"/>
              </svg>
              <span v-else class="btn-spin"></span>
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>

.chat-layout {
  display: flex;
  height: calc(100vh - 60px);
  background: #f0f4f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

.chat-sidebar {
  width: 272px; min-width: 272px;
  background: #fff;
  border-right: 1px solid #e8edf2;
  display: flex; flex-direction: column;
  overflow: hidden; flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 18px 12px;
  border-bottom: 1px solid #f0f3f6;
}

.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
}

.sidebar-logo { width: 36px; height: 36px; flex-shrink: 0; }

.sidebar-brand h3 {
  margin: 0; font-size: 15px; font-weight: 700; color: #1a1a2e;
}

.sidebar-brand p {
  margin: 1px 0 0; font-size: 11px; color: #90a4ae;
}

.sidebar-new-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  margin: 14px 14px 12px; padding: 10px 0;
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .2s;
}

.sidebar-new-btn:hover {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  box-shadow: 0 4px 14px rgba(30,136,229,.3);
}

.sidebar-search {
  display: flex; align-items: center;
  margin: 0 14px 10px; padding: 8px 12px;
  background: #f5f7fa; border-radius: 8px; gap: 8px;
}

.sidebar-search input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 12px; color: #333;
}

.sidebar-search input::placeholder { color: #b0bec5; }

.sidebar-list {
  flex: 1; overflow-y: auto; padding: 0 8px 8px;
}

.sidebar-list::-webkit-scrollbar { width: 4px; }
.sidebar-list::-webkit-scrollbar-thumb { background: #dde4ea; border-radius: 2px; }

.sidebar-item {
  display: flex; align-items: center;
  padding: 10px 12px; border-radius: 8px;
  cursor: pointer; transition: background .15s; margin-bottom: 2px;
}

.sidebar-item:hover { background: #f5f7fa; }
.sidebar-item.active { background: #e3f2fd; }

.sidebar-item-content { flex: 1; min-width: 0; }

.sidebar-item-title {
  display: block; font-size: 13px; color: #37474f;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.sidebar-item.active .sidebar-item-title { color: #1565c0; font-weight: 500; }

.sidebar-item-time {
  font-size: 10px; color: #b0bec5; margin-top: 2px; display: block;
}

.sidebar-item-del {
  opacity: 0; width: 24px; height: 24px;
  border: none; border-radius: 6px; background: transparent;
  color: #cfd8dc; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .15s;
}

.sidebar-item:hover .sidebar-item-del { opacity: 1; }
.sidebar-item-del:hover { background: #ffebee; color: #e53935; }

.sidebar-empty {
  text-align: center; color: #b0bec5; font-size: 12px; padding: 24px 0;
}

.chat-main {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; background: #f8fafb;
}

.welcome-zone {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px; overflow-y: auto;
}

.welcome-body {
  max-width: 620px; width: 100%; text-align: center;
}

.welcome-title {
  font-size: 28px; font-weight: 700; color: #0d2137;
  margin: 0 0 10px; letter-spacing: 1px;
}

.welcome-desc {
  font-size: 15px; color: #607d8b; margin: 0 0 32px; line-height: 1.7;
}

.welcome-search {
  display: flex; align-items: center;
  background: #fff; border: 2px solid #e0e6ed; border-radius: 30px;
  padding: 4px 4px 4px 22px;
  box-shadow: 0 4px 24px rgba(0,0,0,.05);
  transition: border-color .2s; margin-bottom: 20px;
}

.welcome-search:focus-within {
  border-color: #42a5f5;
  box-shadow: 0 4px 28px rgba(30,136,229,.12);
}

.welcome-search input {
  flex: 1; border: none; outline: none;
  font-size: 15px; color: #263238; background: transparent;
  padding: 12px 0;
}

.welcome-search input::placeholder { color: #b0bec5; }

.welcome-search-btn {
  width: 42px; height: 42px; border: none; border-radius: 50%;
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .2s;
}

.welcome-search-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
}

.welcome-search-btn:disabled { opacity: .45; cursor: not-allowed; }

.quick-tags {
  display: flex; flex-wrap: wrap; gap: 10px;
  justify-content: center; margin-bottom: 36px;
}

.quick-tag {
  padding: 7px 18px; background: #fff;
  border: 1px solid #e0e6ed; border-radius: 20px;
  font-size: 13px; color: #455a64; cursor: pointer;
  transition: all .2s;
}

.quick-tag:hover {
  border-color: #42a5f5; color: #1e88e5;
  background: #f5f9ff; box-shadow: 0 2px 8px rgba(30,136,229,.1);
}

.feature-row {
  display: flex; gap: 16px;
}

.feature-card {
  flex: 1; background: #fff; border: 1px solid #e8edf2;
  border-radius: 14px; padding: 22px 16px; text-align: center;
  transition: all .25s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,.07);
  border-color: #bbdefb;
}

.fc-icon {
  width: 52px; height: 52px; margin: 0 auto 10px;
  background: #e3f2fd; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}

.feature-card h4 { margin: 0 0 4px; font-size: 14px; color: #1a1a2e; }
.feature-card p  { margin: 0; font-size: 12px; color: #90a4ae; }

.chat-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; height: 50px; background: #fff;
  border-bottom: 1px solid #edf0f3; flex-shrink: 0;
}

.topbar-title { font-size: 14px; font-weight: 600; color: #1a1a2e; }

.topbar-hint {
  font-size: 12px; color: #42a5f5;
  animation: pulse-opacity 1.5s infinite;
}

@keyframes pulse-opacity {
  0%, 100% { opacity: .6; } 50% { opacity: 1; }
}

.chat-messages {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 18px;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: #dde4ea; border-radius: 2px; }

.msg-row {
  display: flex; gap: 10px; max-width: 80%;
  animation: msg-in .3s ease;
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.msg-user { align-self: flex-end; flex-direction: row-reverse; }
.msg-ai   { align-self: flex-start; }

.msg-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.ai-avatar   { background: #e3f2fd; }
.user-avatar { background: #e8edf2; }

.msg-bubble {
  padding: 12px 16px; border-radius: 14px;
  line-height: 1.6; font-size: 14px; position: relative;
}

.msg-user .msg-bubble {
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  color: #fff; border-bottom-right-radius: 4px;
}

.msg-ai .msg-bubble {
  background: #fff; color: #263238;
  border: 1px solid #edf0f3; border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
}

.msg-text { white-space: pre-wrap; }

.msg-time {
  font-size: 10px; margin-top: 5px; opacity: .45; text-align: right;
}

.msg-user .msg-time { color: rgba(255,255,255,.65); }

.msg-typing {
  display: inline-flex; gap: 3px; margin-left: 4px; vertical-align: middle;
}

.msg-typing span {
  width: 5px; height: 5px; background: #b0bec5; border-radius: 50%;
  animation: dot-bounce 1.4s infinite ease-in-out;
}
.msg-typing span:nth-child(2) { animation-delay: .2s; }
.msg-typing span:nth-child(3) { animation-delay: .4s; }

@keyframes dot-bounce {
  0%, 60%, 100% { opacity: .3; transform: scale(.8); }
  30% { opacity: 1; transform: scale(1); }
}

.chat-input-bar {
  padding: 12px 24px 16px; background: #fff;
  border-top: 1px solid #edf0f3; flex-shrink: 0;
}

.input-bar-box {
  display: flex; align-items: center;
  background: #f5f7fa; border: 1.5px solid #e0e6ed;
  border-radius: 24px; padding: 2px 2px 2px 18px;
  transition: border-color .2s;
}

.input-bar-box:focus-within { border-color: #42a5f5; background: #fff; }

.input-bar-box input {
  flex: 1; border: none; outline: none;
  font-size: 14px; color: #263238; background: transparent;
  padding: 10px 0;
}

.input-bar-box input::placeholder { color: #b0bec5; }
.input-bar-box input:disabled { opacity: .5; }

.input-send-btn {
  width: 38px; height: 38px; border: none; border-radius: 50%;
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .2s;
}

.input-send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  box-shadow: 0 4px 12px rgba(30,136,229,.3);
}

.input-send-btn:disabled { opacity: .45; cursor: not-allowed; }

.btn-spin {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: spin .7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 680px) {
  .chat-sidebar { width: 220px; min-width: 220px; }
  .feature-row { flex-direction: column; gap: 10px; }
  .welcome-title { font-size: 22px; }
  .msg-row { max-width: 92%; }
}
</style>
