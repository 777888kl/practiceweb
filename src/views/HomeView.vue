<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { products, type Product } from '@/data/products'

type CartLine = {
  id: number
  qty: number
}

const CART_KEY = 'shop-cart'
const PROMO_KEY = 'shop-promo'
const PROMO_CODE = 'WEB'

const search = ref('')
const category = ref('all')
const sort = ref('default')

const promoApplied = ref(localStorage.getItem(PROMO_KEY) === PROMO_CODE)
const promoInput = ref(promoApplied.value ? PROMO_CODE : '')
const promoMessage = ref(promoApplied.value ? 'Промокод WEB применён: скидка 10%' : '')

const cart = ref<CartLine[]>(loadCart())

const categories = [...new Set(products.map((product) => product.category))]

const visibleProducts = computed(() => {
  const query = search.value.trim().toLowerCase()

  const filtered = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(query)
    const matchesCategory = category.value === 'all' || product.category === category.value
    return matchesName && matchesCategory
  })

  if (sort.value === 'asc') {
    return [...filtered].sort((a, b) => a.price - b.price)
  }
  if (sort.value === 'desc') {
    return [...filtered].sort((a, b) => b.price - a.price)
  }
  return filtered
})

const cartView = computed(() => {
  return cart.value.flatMap((line) => {
    const product = products.find((item) => item.id === line.id)
    if (!product) return []
    const price = salePrice(product.price)
    return [{ line, product, price, sum: price * line.qty }]
  })
})

const total = computed(() => cartView.value.reduce((sum, item) => sum + item.sum, 0))
const totalCount = computed(() => cart.value.reduce((sum, line) => sum + line.qty, 0))

watch(cart, () => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart.value))
}, { deep: true })

watch(promoApplied, (applied) => {
  if (applied) localStorage.setItem(PROMO_KEY, PROMO_CODE)
  else localStorage.removeItem(PROMO_KEY)
})

function loadCart(): CartLine[] {
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []

  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []

    return data.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const id = Number((item as { id?: unknown }).id)
      const qty = Number((item as { qty?: unknown }).qty)
      const exists = products.some((product) => product.id === id)
      if (!exists || !Number.isInteger(qty) || qty < 1) return []
      return [{ id, qty }]
    })
  } catch {
    return []
  }
}

function salePrice(price: number) {
  return promoApplied.value ? Math.round(price * 0.9) : price
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
}

function addToCart(product: Product) {
  const line = cart.value.find((item) => item.id === product.id)
  if (line) line.qty += 1
  else cart.value.push({ id: product.id, qty: 1 })
}

function decrease(id: number) {
  const line = cart.value.find((item) => item.id === id)
  if (!line) return
  if (line.qty === 1) removeFromCart(id)
  else line.qty -= 1
}

function removeFromCart(id: number) {
  cart.value = cart.value.filter((item) => item.id !== id)
}

function clearCart() {
  cart.value = []
}

function applyPromo() {
  if (promoInput.value.trim().toUpperCase() === PROMO_CODE) {
    promoApplied.value = true
    promoMessage.value = 'Промокод WEB применён: скидка 10%'
    return
  }

  promoApplied.value = false
  promoMessage.value = 'Такого промокода нет'
}
</script>

<template>
  <div class="page">
    <header class="header">
      <div>
        <p class="eyebrow">Интернет-магазин</p>
        <h1>Каталог товаров</h1>
      </div>
      <p class="cart-badge">В корзине: {{ totalCount }}</p>
    </header>

    <main class="layout">
      <section class="catalog">
        <div class="toolbar">
          <input v-model="search" type="search" placeholder="Поиск по названию" />

          <select v-model="category">
            <option value="all">Все категории</option>
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>

          <select v-model="sort">
            <option value="default">Без сортировки</option>
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
          </select>
        </div>

        <p v-if="visibleProducts.length === 0" class="empty">Ничего не найдено</p>

        <div class="grid">
          <article v-for="product in visibleProducts" :key="product.id" class="card">
            <img :src="product.image" :alt="product.name" />
            <p class="category">{{ product.category }}</p>
            <h2>{{ product.name }}</h2>
            <p class="price">
              <span v-if="promoApplied" class="old">{{ formatPrice(product.price) }}</span>
              {{ formatPrice(salePrice(product.price)) }}
            </p>
            <button type="button" @click="addToCart(product)">В корзину</button>
          </article>
        </div>
      </section>

      <aside class="cart">
        <h2>Корзина</h2>

        <p v-if="cartView.length === 0" class="empty">Корзина пуста</p>

        <ul v-else>
          <li v-for="item in cartView" :key="item.product.id">
            <div>
              <strong>{{ item.product.name }}</strong>
              <p>{{ formatPrice(item.price) }} × {{ item.line.qty }}</p>
            </div>
            <div class="qty">
              <button type="button" @click="decrease(item.product.id)">−</button>
              <span>{{ item.line.qty }}</span>
              <button type="button" @click="addToCart(item.product)">+</button>
              <button type="button" class="link" @click="removeFromCart(item.product.id)">Удалить</button>
            </div>
            <p class="line-sum">{{ formatPrice(item.sum) }}</p>
          </li>
        </ul>

        <form class="promo" @submit.prevent="applyPromo">
          <input v-model="promoInput" type="text" placeholder="Промокод" />
          <button type="submit">Применить</button>
        </form>
        <p v-if="promoMessage" class="promo-message" :class="{ ok: promoApplied }">{{ promoMessage }}</p>

        <p class="total">Итого: {{ formatPrice(total) }}</p>
        <button type="button" class="clear" :disabled="cart.length === 0" @click="clearCart">
          Очистить корзину
        </button>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.header,
.toolbar,
.cart li,
.qty,
.promo {
  display: flex;
  gap: 12px;
}

.header {
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #3b6d5a;
  font-size: 14px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
}

.cart-badge {
  background: #fff;
  border-radius: 999px;
  padding: 8px 14px;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}

.toolbar,
.card,
.cart {
  background: #fff;
  border-radius: 16px;
}

.toolbar {
  padding: 12px;
  margin-bottom: 16px;
}

.toolbar input,
.toolbar select,
.promo input {
  flex: 1;
  min-width: 0;
}

input,
select,
button {
  font: inherit;
}

input,
select {
  border: 1px solid #d7ddd9;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: #1f7a4d;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: default;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

.card {
  padding: 14px;
}

.card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
}

.category {
  margin-top: 10px;
  color: #667085;
  font-size: 13px;
}

.card h2 {
  margin: 4px 0 10px;
  font-size: 18px;
}

.price {
  font-weight: 700;
  margin-bottom: 12px;
}

.old {
  margin-right: 8px;
  color: #98a2b3;
  font-weight: 500;
  text-decoration: line-through;
}

.card button,
.promo button,
.clear {
  width: 100%;
}

.cart {
  padding: 16px;
  position: sticky;
  top: 16px;
}

.cart h2 {
  margin-bottom: 12px;
}

.cart ul {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}

.cart li {
  flex-direction: column;
  padding: 12px 0;
  border-top: 1px solid #eef2f0;
}

.qty {
  align-items: center;
}

.qty button {
  width: 32px;
  padding: 6px 0;
}

.link {
  width: auto;
  margin-left: auto;
  background: transparent;
  color: #b42318;
  padding: 0;
}

.line-sum {
  font-weight: 700;
}

.promo {
  margin-top: 8px;
}

.promo-message {
  margin-top: 8px;
  color: #b42318;
  font-size: 14px;
}

.promo-message.ok {
  color: #1f7a4d;
}

.total {
  margin: 16px 0 10px;
  font-size: 20px;
  font-weight: 700;
}

.empty {
  color: #667085;
  padding: 8px 0;
}

@media (max-width: 800px) {
  .layout,
  .header,
  .toolbar {
    display: block;
  }

  .header h1 {
    font-size: 26px;
  }

  .cart-badge,
  .toolbar input,
  .toolbar select {
    margin-top: 10px;
  }

  .cart {
    position: static;
    margin-top: 16px;
  }
}
</style>
