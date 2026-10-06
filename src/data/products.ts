export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
}

export const products: Product[] = [
  { id: 1, name: 'Ноутбук Pro 14', price: 89990, category: 'Электроника', image: '/images/laptop.svg' },
  { id: 2, name: 'Механическая клавиатура', price: 7500, category: 'Электроника', image: '/images/keyboard.svg' },
  { id: 3, name: 'Кружка разработчика', price: 690, category: 'Аксессуары', image: '/images/mug.svg' },
  { id: 4, name: 'Худи "Vue Master"', price: 3200, category: 'Одежда', image: '/images/hoodie.svg' },
  { id: 5, name: 'Мышь беспроводная', price: 2400, category: 'Электроника', image: '/images/mouse.svg' },
  { id: 6, name: 'Стикерпак с логотипом', price: 150, category: 'Аксессуары', image: '/images/stickers.svg' },
  { id: 7, name: 'Монитор 27"', price: 24990, category: 'Электроника', image: '/images/monitor.svg' },
  { id: 8, name: 'Кепка "Frontend"', price: 1100, category: 'Одежда', image: '/images/cap.svg' },
]
