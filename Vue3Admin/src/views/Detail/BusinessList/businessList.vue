<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getBusinessList } from '@/serve/InfoGet/InfoGet'
import router from '@/router'
import { getToken } from '@/utils/cache/cookies'

const businessList = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getBusinessList()
    businessList.value = res.data.results || []
  } finally {
    loading.value = false
  }
})

const goDetail = (item: any) => {
  if (item.Burl) {
    window.open(item.Burl, '_blank')
    return
  }
  if (getToken()) {
    router.push({ name: 'business', params: { bid: item.Bid } })
  } else {
    router.push('/login')
  }
}

const goHome = () => router.push('/')
</script>

<template>
  <div class="list-page">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <span class="crumb" @click="goHome">首页</span>
      <span class="sep">/</span>
      <span class="crumb active">全部商家</span>
    </div>

    <!-- 标题 -->
    <div class="page-header">
      <h1>全部商家</h1>
      <p class="subtitle">发现品质好店，享受优质服务</p>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <span>加载中...</span>
    </div>

    <!-- 商家网格 -->
    <div v-else class="shop-grid">
      <div
        class="shop-card"
        v-for="item in businessList"
        :key="item.Bid"
        @click="goDetail(item)"
      >
        <div class="card-img-box">
          <img
            class="card-img"
            :src="item.Bimg || 'http://localhost:3000/default.png'"
            :alt="item.Bname"
          />
        </div>
        <div class="card-body">
          <h3 class="card-name">{{ item.Bname }}</h3>
          <p class="card-desc">{{ item.Bdesc || '暂无描述' }}</p>
          <span class="card-link">查看详情 →</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && businessList.length === 0" class="empty-box">
      <p>暂未收录商家，敬请期待</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary: #1a73e8;
$text-dark: #1a1a2e;
$text-gray: #666;

.list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

.breadcrumb {
  font-size: 14px;
  color: $text-gray;
  margin-bottom: 20px;

  .crumb {
    cursor: pointer;
    &:hover { color: $primary; }
  }
  .active {
    color: $text-dark;
    font-weight: 600;
    cursor: default;
  }
  .sep { margin: 0 6px; }
}

.page-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 30px;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 8px;
  }
  .subtitle {
    font-size: 15px;
    color: $text-gray;
    margin: 0;
  }
}

.loading-box {
  text-align: center;
  padding: 80px 0;
  color: $text-gray;
  font-size: 15px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  @media (max-width: 960px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 680px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 440px) { grid-template-columns: 1fr; }
}

.shop-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  cursor: pointer;
  transition: all .3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,.12);
  }
}

.card-img-box {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #eef2f7;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .4s;

  .shop-card:hover & {
    transform: scale(1.06);
  }
}

.card-body {
  padding: 18px 16px;
}

.card-name {
  font-size: 17px;
  font-weight: 600;
  color: $text-dark;
  margin: 0 0 8px;
}

.card-desc {
  font-size: 13px;
  color: $text-gray;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-link {
  font-size: 13px;
  color: $primary;
  font-weight: 500;
}

.empty-box {
  text-align: center;
  padding: 80px 0;
  color: #999;
  font-size: 15px;
}
</style>
