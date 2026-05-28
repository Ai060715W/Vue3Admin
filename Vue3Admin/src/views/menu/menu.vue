<script setup lang="ts">
import {onMounted, ref} from "vue";
import {getBusinessList} from "@/serve/InfoGet/InfoGet";
import router from "@/router";
import {getToken} from "@/utils/cache/cookies";

const push = (index: any) => {
  if (index.Burl) {
    window.open(index.Burl, '_blank')
    return
  }
  if (getToken()) {
    router.push({ name: 'business', params: { bid: index.Bid } })
  } else {
    router.push('/login')
  }
}

const goAllShops = () => {
  router.push('/businessList')
}

const businessList = ref()
onMounted(async () => {
  businessList.value = (await getBusinessList()).data.results
})
</script>

<template>
  <div class="home-page">

    <section class="hero-section">
      <div class="hero-bg-decor"></div>
      <div class="hero-content">
        <h1 class="hero-title">和优秀的人 做有挑战的事</h1>
      </div>
    </section>

    <section class="section-block" v-if="businessList && businessList.length">
      <div class="section-header">
        <h2 class="section-title">入驻商家</h2>
        <span class="section-more" @click="goAllShops">查看全部 →</span>
      </div>
      <div class="shop-grid">
        <div class="shop-card" v-for="index in businessList.slice(0, 3)" :key="index.Bid" @click="push(index)">
          <img class="shop-avatar" :src="index.Bimg ? index.Bimg : 'http://localhost:3000/default.png'" alt="">
          <div class="shop-info">
            <h4>{{ index.Bname }}</h4>
            <p>{{ index.Bdesc || '暂无描述' }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>

$primary: #1a73e8;
$text-dark: #1a1a2e;
$text-gray: #666;
$card-bg: #fff;

.hero-section {
  position: relative;
  background: linear-gradient(160deg, #e8f0fe 0%, #d4e4fc 40%, #c5d9f8 70%, #eef3fb 100%);
  padding: 80px 40px 60px;
  text-align: center;
  overflow: hidden;
}

.hero-bg-decor {
  position: absolute;
  top: -60px;
  right: -80px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26,115,232,.12) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
  letter-spacing: 2px;
  line-height: 1.3;
}

.section-block {
  padding: 60px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

.section-title {
  font-size: 26px;
  font-weight: 700;
  color: $text-dark;
  margin: 0;
  position: relative;
  padding-left: 16px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 4px;
    background: $primary;
    border-radius: 2px;
  }
}

.section-more {
  font-size: 14px;
  color: $primary;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

.shop-card {
  background: $card-bg;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
  cursor: pointer;
  transition: all .25s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,.1);
  }

  .shop-avatar {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }

  .shop-info {
    padding: 16px;

    h4 { margin: 0 0 6px; font-size: 16px; color: $text-dark; }
    p { margin: 0; font-size: 13px; color: $text-gray; line-height: 1.5; }
  }
}
</style>
