// The Golden Ladle — config.js
// One job: every tunable fact about the game lives here. Recipes, ingredients,
// timings, colours, layout numbers. Nothing here draws or updates anything.
(function (global) {
  'use strict';

  var GOLDEN_LADLE_CONFIG = {
    canvasWidth: 1280,
    canvasHeight: 800,
    shiftSeconds: 150,
    maxOrders: 4,
    firstOrderAt: 2,
    spawnIntervalStart: 14,
    spawnIntervalEnd: 7,
    patienceStart: 48,
    patienceEnd: 32,
    doubleStackUnlockAt: 60,
    grillSeconds: 4,
    burnAfterSeconds: 9,
    chopSeconds: 1.6,
    grillSlots: 2,
    chefSpeed: 300,
    chefRadius: 22,
    interactRange: 62,

    // Coins paid per finished dish, before the patience tip.
    ingredients: {
      bun:     { name: 'Bun',      color: '#e8b25c', dark: '#b97f2e', needs: 'none' },
      patty:   { name: 'Patty',    color: '#8a5a33', dark: '#5d3a1e', needs: 'grill' },
      lettuce: { name: 'Lettuce',  color: '#69b84f', dark: '#3f7d2e', needs: 'none' },
      tomato:  { name: 'Tomato',   color: '#e14b3a', dark: '#a82c20', needs: 'chop' },
      cheese:  { name: 'Cheese',   color: '#f6c945', dark: '#c79a1d', needs: 'none' }
    },

    // A recipe is the exact multiset of prepared items a plate must hold.
    // pattyCooked / tomatoChopped are the prepared forms.
    recipes: [
      {
        id: 'salad', name: 'Garden Salad', price: 8,
        items: ['lettuce', 'tomatoChopped'],
        blurb: 'Crisp lettuce, chopped tomato.'
      },
      {
        id: 'burger', name: 'Classic Burger', price: 14,
        items: ['bun', 'pattyCooked', 'lettuce'],
        blurb: 'Bun, grilled patty, lettuce.'
      },
      {
        id: 'melt', name: 'Cheese Melt', price: 16,
        items: ['bun', 'pattyCooked', 'cheese'],
        blurb: 'Bun, grilled patty, melted cheese.'
      },
      {
        id: 'veggie', name: 'Veggie Stack', price: 18,
        items: ['bun', 'lettuce', 'tomatoChopped', 'cheese'],
        blurb: 'Bun, lettuce, tomato, cheese.'
      },
      {
        id: 'double', name: 'Double Stack', price: 26, unlockAt: 60,
        items: ['bun', 'pattyCooked', 'pattyCooked', 'cheese', 'tomatoChopped'],
        blurb: 'Two patties, cheese, tomato. The rush hour special.'
      }
    ],

    // Tip: up to +50% of the price when served with patience to spare.
    tipMaxFraction: 0.5,

    stars: { one: 90, two: 160, three: 240 },

    palette: {
      wall: '#f3e2c2', wallDark: '#e5cf9f',
      floorA: '#c98d5f', floorB: '#bd7f52',
      counterWood: '#a06a3b', counterTop: '#c98f56', counterEdge: '#7d4f27',
      board: '#2e2a26', boardPaper: '#fdf6e3',
      hud: '#2e2a26', hudText: '#fdf6e3',
      accent: '#e14b3a', gold: '#f6c945', green: '#69b84f',
      grillOff: '#4a4a52', grillOn: '#e2703a',
      text: '#2e2a26', muted: '#7a6a58'
    }
  };

  global.GOLDEN_LADLE_CONFIG = GOLDEN_LADLE_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
