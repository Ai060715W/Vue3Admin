import { getToken } from "@/utils/cache/cookies"

const BASE_URL = 'http://localhost:3000/'

/**
 * 获取通用请求头
 */
const getHeaders = (): HeadersInit => ({
    'authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    'x-refresh-token': localStorage.getItem('reFlushToken') || '',
})

/**
 * DeepSeek 流式聊天（使用 Fetch API + ReadableStream）
 * @param msg - 用户消息
 * @param onChunk - 每个文本块的回调
 * @param onDone - 流结束回调
 * @param onError - 错误回调
 */
export const chatStream = async (
    msg: string,
    onChunk: (text: string) => void,
    onDone?: (fullText: string) => void,
    onError?: (error: Error) => void
): Promise<void> => {
    let fullText = ''

    try {
        const response = await fetch(`${BASE_URL}chat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content: msg }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('无法获取响应流')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 按行解析 SSE 数据
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith(':')) continue // 跳过注释和空行

                if (trimmed === 'data: [DONE]') {
                    // 流结束标记
                    break
                }

                if (trimmed.startsWith('data: [ERROR]')) {
                    const errMsg = trimmed.substring(14).trim()
                    throw new Error(errMsg || 'AI 服务错误')
                }

                if (trimmed.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmed.substring(6)
                        const data = JSON.parse(jsonStr)
                        const content = data.choices?.[0]?.delta?.content
                        if (content) {
                            fullText += content
                            onChunk(content)
                        }
                    } catch {
                        // 忽略解析错误的行
                    }
                }
            }
        }

        // 流结束后通知后端保存历史
        if (fullText) {
            fetch(`${BASE_URL}finish`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content: fullText }),
            }).catch(() => {}) // 静默失败
        }
        
        onDone?.(fullText)
        
    } catch (error) {
        console.error('[DeepSeek Chat Error]:', error)
        onError?.(error as Error)
    }
}

/**
 * 重置会话（清除对话历史）
 */
export const leaveSession = async (): Promise<void> => {
    await fetch(`${BASE_URL}leave`, {
        method: 'POST',
        headers: getHeaders(),
    })
}

/**
 * 获取临时Token（未登录场景）
 */
export const getSessionToken = async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}getToken`, {
        method: 'GET',
        headers: getHeaders(),
    })
    return response.text()
}

// 兼容旧的调用方式（非流式，返回Promise但实际内部用流式处理）
export const chat = async (msg: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        chatStream(
            msg,
            () => {}, // onChunk - 不需要中间回调
            (fullText) => resolve(fullText),
            (error) => reject(error)
        )
    })
}