
const OpenAi = require('openai')
const config = require('config')

// DeepSeek API 配置 - 兼容 OpenAI SDK
const client = new OpenAi({
    apiKey: config.get('DeepSeekConfig.apiKey'),
    baseURL: config.get('DeepSeekConfig.baseURL'),
})

/**
 * DeepSeek 聊天对话
 * @param {string} prompt - 用户输入的消息
 * @param {Array} history - 对话历史记录
 * @returns {Promise} 流式响应
 */
const chat = async (prompt, history) => {
    try {
        // 维护对话历史长度：保留 system prompt + 最近4轮对话(8条消息)
        // system prompt 在 history[0]，用户+助手消息交替
        if (history.length >= 9) {
            // 保留 system prompt(index 0) + 最近4轮对话(8条)
            history.splice(1, history.length - 9)
        }
        history.push({ role: "user", content: prompt })
        
        return client.chat.completions.create({
            model: config.get('DeepSeekConfig.model'),
            messages: history,
            stream: true,
            temperature: config.get('DeepSeekConfig.temperature'),
            max_tokens: config.get('DeepSeekConfig.maxTokens'),
        })
    } catch (err) {
        console.error('DeepSeek API 调用错误:', err)
        throw err
    }
}

module.exports = chat