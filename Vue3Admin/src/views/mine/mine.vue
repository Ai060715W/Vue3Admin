<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useUserStoreHook } from '@/stores/modules/users'
import { request } from '@/utils/service'
import { getOrderListByStatus, getOrderListByUid } from '@/serve/Order/order'
import { getBusinessList } from '@/serve/InfoGet/InfoGet'
import { ElLoading } from 'element-plus'
import router from '@/router'

const userStore = useUserStoreHook()
const isAdmin = computed(() => userStore.roles.includes('Admin'))
const isBusiness = computed(() => userStore.roles.includes('Business'))
const isUser = computed(() => userStore.roles.includes('User'))

const adminSummary = ref<any>({})
const allUsers = ref<any[]>([])
const allBusinesses = ref<any[]>([])
const adminOrders = ref<any[]>([])

const bizSummary = ref<any>({})
const bizProducts = ref<any[]>([])

const userOrders = ref<any[]>([])
const userTodos = ref<any[]>([])
const choice = ref('全部')
const loading = ref(true)

onMounted(async () => {
  const load = ElLoading.service({ text: '加载中' })
  try {
    if (isAdmin.value) {
      const [summaryRes, usersRes, bizRes] = await Promise.all([
        request({ url: 'adminSummary', method: 'get' }),
        request({ url: 'getUserList', method: 'get' }),
        getBusinessList()
      ])
      adminSummary.value = summaryRes.data.summary
      allUsers.value = usersRes.data.results || []
      allBusinesses.value = bizRes.data.results || []
      adminOrders.value = summaryRes.data.recentOrders || []
    } else if (isBusiness.value) {
      const [summaryRes, todoRes] = await Promise.all([
        request({ url: 'businessSummary', method: 'get' }),
        request({ url: 'getTodo', method: 'get' })
      ])
      bizSummary.value = summaryRes.data
      userTodos.value = todoRes.data.results || []
      if (summaryRes.data.business) {
        const productRes = await request({
          url: 'productInfo', method: 'get', params: { bid: summaryRes.data.business.Bid }
        })
        bizProducts.value = productRes.data.results || []
      }
    } else {
      const [orderRes, todoRes] = await Promise.all([
        getOrderListByUid(),
        request({ url: 'getTodo', method: 'get' })
      ])
      userOrders.value = orderRes.data || []
      userTodos.value = todoRes.data.results || []
    }
  } finally {
    loading.value = false; load.close()
  }
})

const tabChange = async (name: string) => {
  const load = ElLoading.service({ text: '加载中' })
  try {
    userOrders.value = name === '全部' ? (await getOrderListByUid()).data : (await getOrderListByStatus(name)).data
  } finally { load.close() }
}

const goControl = () => router.push('/control')
const goBusinessControl = () => router.push({ name: 'businessControl', params: { Bid: bizSummary.value.business?.Bid } })
</script>

<template>
  <div class="mine-page" v-loading="loading">

    <div class="profile-card">
      <div class="profile-left">
        <el-avatar :size="64" :src="userStore.avatar" class="profile-avatar" />
        <div class="profile-info">
          <h2>{{ userStore.username }}</h2>
          <el-tag :type="isAdmin ? 'danger' : isBusiness ? 'warning' : 'info'" size="small">
            {{ isAdmin ? '管理员' : isBusiness ? '商家' : '普通用户' }}
          </el-tag>
        </div>
      </div>
      <div class="profile-right">
        <el-button v-if="isAdmin" type="primary" @click="goControl">管理界面</el-button>
        <el-button v-if="isBusiness" type="warning" @click="goBusinessControl">商店管理</el-button>
      </div>
    </div>

    <template v-if="isAdmin">
      <div class="stat-grid">
        <div class="stat-card blue"><div class="stat-num">{{ adminSummary?.userCount ?? '-' }}</div><div class="stat-label">总用户数</div></div>
        <div class="stat-card green"><div class="stat-num">{{ adminSummary?.bizCount ?? '-' }}</div><div class="stat-label">入驻商家</div></div>
        <div class="stat-card orange"><div class="stat-num">{{ adminSummary?.productCount ?? '-' }}</div><div class="stat-label">商品总数</div></div>
        <div class="stat-card purple"><div class="stat-num">{{ adminSummary?.orderCount ?? '-' }}</div><div class="stat-label">订单总数</div></div>
        <div class="stat-card teal"><div class="stat-num">{{ adminSummary?.todoCount ?? '-' }}</div><div class="stat-label">待办事项</div></div>
      </div>

      <div class="section">
        <h3 class="section-title">👥 所有用户</h3>
        <el-table :data="allUsers" border stripe size="small">
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="phone" label="电话" />
          <el-table-column label="角色">
            <template #default="{ row }">
              <el-tag :type="row.permissionGroupId === 1 ? 'danger' : row.permissionGroupId === 3 ? 'warning' : 'info'" size="small">
                {{ row.permissionGroupId === 1 ? '管理员' : row.permissionGroupId === 3 ? '商家' : '用户' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="section">
        <h3 class="section-title">🏪 入驻商家</h3>
        <el-table :data="allBusinesses" border stripe size="small">
          <el-table-column label="图片">
            <template #default="{ row }"><el-avatar :size="40" :src="row.Bimg" shape="square" /></template>
          </el-table-column>
          <el-table-column prop="Bname" label="商家名称" />
          <el-table-column prop="Bdesc" label="描述" show-overflow-tooltip />
        </el-table>
      </div>

      <div class="section" v-if="adminOrders.length">
        <h3 class="section-title">📦 最近订单</h3>
        <div v-for="item in adminOrders" :key="item.Oid">
          <el-card class="order-card" shadow="hover">
            <div class="order-header">
              <el-tag>订单号: {{ item.Oid }}</el-tag>
              <el-tag :type="item.status === 'completed' ? 'success' : 'warning'">{{ item.status }}</el-tag>
            </div>
            <el-table :data="item.ProuductList" border size="small">
              <el-table-column label="图片"><template #default="{ row }"><el-image :src="row.Pimg" style="width:40px;height:40px;border-radius:4px" fit="cover" />
</template></el-table-column>
              <el-table-column prop="Pname" label="产品" />
              <el-table-column prop="Pprice" label="价格" />
              <el-table-column prop="Count" label="数量" />
            </el-table>
          </el-card>
        </div>
      </div>
    </template>

    <!-- ====== 商家面板 ====== -->
    <template v-if="isBusiness && !isAdmin">
      <div class="stat-grid">
        <div class="stat-card blue"><div class="stat-num">{{ bizSummary.productCount }}</div><div class="stat-label">商品数</div></div>
        <div class="stat-card orange"><div class="stat-num">{{ bizSummary.orderCount }}</div><div class="stat-label">收到订单</div></div>
        <div class="stat-card teal"><div class="stat-num">{{ userTodos.length }}</div><div class="stat-label">待办事项</div></div>
      </div>

      <div class="section" v-if="bizSummary.business">
        <h3 class="section-title">🏪 {{ bizSummary.business.Bname }}</h3>
        <p class="biz-desc">{{ bizSummary.business.Bdesc }}</p>
      </div>

      <div class="section" v-if="bizProducts.length">
        <h3 class="section-title">📦 我的商品</h3>
        <div class="product-grid">
          <div class="product-item" v-for="p in bizProducts" :key="p.Pid">
            <el-image :src="p.Pimg" style="width:100%;height:120px;object-fit:cover;border-radius:8px" />
            <div class="product-info"><strong>{{ p.Pname }}</strong><span class="price">¥{{ p.Pprice }}</span></div>
          </div>
        </div>
      </div>

      <div class="section" v-if="userTodos.length">
        <h3 class="section-title">📝 待办事项</h3>
        <el-timeline>
          <el-timeline-item v-for="t in userTodos" :key="t.id" :timestamp="t.CreateTime">{{ t.todo }}</el-timeline-item>
        </el-timeline>
      </div>
    </template>

    <!-- ====== 普通用户面板 ====== -->
    <template v-if="isUser && !isAdmin && !isBusiness">
      <el-tabs v-model="choice" @tab-change="tabChange" type="card">
        <el-tab-pane label="全部订单" name="全部">
          <div v-for="item in userOrders" :key="item.Oid">
            <el-card class="order-card" shadow="hover">
              <div class="order-header">
                <el-tag>订单号: {{ item.Oid }}</el-tag>
                <el-tag :type="item.status === 'completed' ? 'success' : 'warning'">{{ item.status }}</el-tag>
              </div>
              <el-table :data="item.ProuductList" border size="small">
              <el-table-column label="图片"><template #default="{ row }"><el-image :src="row.Pimg" style="width:40px;height:40px;border-radius:4px" fit="cover" />
</template></el-table-column>
                <el-table-column prop="Pname" label="产品" />
                <el-table-column prop="Pprice" label="价格" />
                <el-table-column prop="Count" label="数量" />
              </el-table>
            </el-card>
          </div>
          <el-empty v-if="!userOrders.length" description="暂无订单" />
        </el-tab-pane>
        <el-tab-pane label="进行中" name="进行中">
          <div v-for="item in userOrders" :key="item.Oid">
            <el-card class="order-card" shadow="hover">
              <div class="order-header">
                <el-tag>订单号: {{ item.Oid }}</el-tag>
                <el-tag type="warning">{{ item.status }}</el-tag>
              </div>
              <el-table :data="item.ProuductList" border size="small">
              <el-table-column label="图片"><template #default="{ row }"><el-image :src="row.Pimg" style="width:40px;height:40px;border-radius:4px" fit="cover" />
</template></el-table-column>
                <el-table-column prop="Pname" label="产品" />
                <el-table-column prop="Pprice" label="价格" />
                <el-table-column prop="Count" label="数量" />
              </el-table>
            </el-card>
          </div>
          <el-empty v-if="!userOrders.length" description="暂无进行中订单" />
        </el-tab-pane>
        <el-tab-pane label="已完成" name="已完成">
          <div v-for="item in userOrders" :key="item.Oid">
            <el-card class="order-card" shadow="hover">
              <div class="order-header">
                <el-tag>订单号: {{ item.Oid }}</el-tag>
                <el-tag type="success">{{ item.status }}</el-tag>
              </div>
              <el-table :data="item.ProuductList" border size="small">
              <el-table-column label="图片"><template #default="{ row }"><el-image :src="row.Pimg" style="width:40px;height:40px;border-radius:4px" fit="cover" />
</template></el-table-column>
                <el-table-column prop="Pname" label="产品" />
                <el-table-column prop="Pprice" label="价格" />
                <el-table-column prop="Count" label="数量" />
              </el-table>
            </el-card>
          </div>
          <el-empty v-if="!userOrders.length" description="暂无已完成订单" />
        </el-tab-pane>
      </el-tabs>

      <div class="section" v-if="userTodos.length" style="margin-top:20px">
        <h3 class="section-title">📝 我的待办</h3>
        <el-timeline>
          <el-timeline-item v-for="t in userTodos" :key="t.id" :timestamp="t.CreateTime">{{ t.todo }}</el-timeline-item>
        </el-timeline>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.mine-page { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
.profile-card { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
.profile-left { display: flex; align-items: center; gap: 16px; }
.profile-avatar { border: 3px solid #e8f0fe; }
.profile-info h2 { margin: 0 0 6px; font-size: 22px; color: #1a1a2e; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.05); border-left: 4px solid; }
.stat-card.blue { border-color: #1a73e8; .stat-num { color: #1a73e8; } }
.stat-card.green { border-color: #34a853; .stat-num { color: #34a853; } }
.stat-card.orange { border-color: #f59e0b; .stat-num { color: #f59e0b; } }
.stat-card.purple { border-color: #8b5cf6; .stat-num { color: #8b5cf6; } }
.stat-card.teal { border-color: #14b8a6; .stat-num { color: #14b8a6; } }
.stat-num { font-size: 30px; font-weight: 700; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
.section { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.section-title { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 0 0 16px; }
.order-card { margin-bottom: 12px; }
.order-header { display: flex; gap: 12px; margin-bottom: 10px; }
.biz-desc { font-size: 14px; color: #666; line-height: 1.6; }
.product-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
@media (max-width: 700px) { .product-grid { grid-template-columns: repeat(2,1fr); } }
.product-item { background: #f9fafb; border-radius: 10px; overflow: hidden; text-align: center; transition: all .2s; &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); } }
.product-info { padding: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; .price { color: #f56c6c; font-weight: 600; } }
</style>