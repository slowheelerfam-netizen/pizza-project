export const ORDER_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'QUEUED',
  IN_PREP: 'IN_PREP',
  PREP: 'PREP',
  OVEN: 'OVEN',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const PIZZA_SIZES = {
  SMALL: { id: 'sm', label: 'Small (10")', priceMultiplier: 0.8 },
  MEDIUM: { id: 'md', label: 'Medium (12")', priceMultiplier: 1.0 },
  LARGE: { id: 'lg', label: 'Large (14")', priceMultiplier: 1.2 },
  XL: { id: 'xl', label: 'X-Large (16")', priceMultiplier: 1.5 },
}

export const CRUST_TYPES = {
  THIN: { id: 'thin', label: 'Thin Crust', price: 0 },
  ORIGINAL: { id: 'original', label: 'Original Hand Tossed', price: 0 },
  DEEP: { id: 'deep', label: 'Deep Dish', price: 2 },
  GF: { id: 'gf', label: 'Gluten Free', price: 3 },
}

export const TOPPINGS = {
  PEPPERONI: { id: 'pep', label: 'Pepperoni', price: 1.5 },
  MUSHROOMS: { id: 'mush', label: 'Mushrooms', price: 1.0 },
  ONIONS: { id: 'onions', label: 'Onions', price: 1.0 },
  SAUSAGE: { id: 'sausage', label: 'Sausage', price: 1.5 },
  BACON: { id: 'bacon', label: 'Bacon', price: 1.5 },
  EXTRA_CHEESE: { id: 'xcheese', label: 'Extra Cheese', price: 2.0 },
  PEPPERS: { id: 'peppers', label: 'Green Peppers', price: 1.0 },
  OLIVES: { id: 'olives', label: 'Black Olives', price: 1.0 },
}

export const MENU_ITEMS = [
  {
    id: 'm1',
    name: 'Margherita',
    basePrice: 10,
    description: 'Classic tomato sauce and mozzarella',
    defaultToppings: [],
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Fresh Basil'],
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'm2',
    name: 'Pepperoni',
    basePrice: 12,
    description: 'A classic favorite with generous pepperoni',
    defaultToppings: ['pep'],
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Pepperoni'],
    image:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'm3',
    name: 'Veggie Supreme',
    basePrice: 14,
    description: 'Loaded with fresh vegetables',
    defaultToppings: ['mush', 'onions', 'peppers', 'olives'],
    ingredients: [
      'Tomato Sauce',
      'Mozzarella',
      'Mushrooms',
      'Onions',
      'Peppers',
      'Olives',
    ],
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'm4',
    name: 'Meat Lovers',
    basePrice: 16,
    description: 'Pepperoni, sausage, and bacon',
    defaultToppings: ['pep', 'sausage', 'bacon'],
    ingredients: [
      'Tomato Sauce',
      'Mozzarella',
      'Pepperoni',
      'Sausage',
      'Bacon',
    ],
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop',
  },
]

export const ORDER_DEFAULTS = {
  assumeChefRole: false,
  isPriority: false,
}
