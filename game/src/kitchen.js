// The Golden Ladle — kitchen.js
// One job: the kitchen's floor plan. Every station's rectangle, label,
// what it does, and the spot the chef stands to use it.
(function (global) {
  'use strict';

  // Stations are laid out on a 1280x800 canvas. The order board lives on the
  // left (x 16..240); the kitchen floor is x 256..1264, y 80..768.
  // The chef walks the floor; each station has an approach point just
  // outside its rectangle.
  function makeKitchen() {
    var stations = [
      {
        id: 'serve', kind: 'serve', label: 'SERVING WINDOW',
        x: 1064, y: 96, w: 184, h: 92,
        approach: { x: 1156, y: 216 }, color: '#69b84f'
      },
      {
        id: 'plates', kind: 'plates', label: 'PLATES',
        x: 880, y: 96, w: 160, h: 92,
        approach: { x: 960, y: 216 }, color: '#fdf6e3'
      },
      {
        id: 'trash', kind: 'trash', label: 'TRASH',
        x: 720, y: 96, w: 136, h: 92,
        approach: { x: 788, y: 216 }, color: '#8a8a92'
      },
      {
        id: 'grill', kind: 'grill', label: 'GRILL',
        x: 280, y: 248, w: 220, h: 130,
        approach: { x: 390, y: 402 }, color: '#e2703a'
      },
      {
        id: 'board', kind: 'board', label: 'CHOPPING BOARD',
        x: 560, y: 248, w: 220, h: 130,
        approach: { x: 670, y: 402 }, color: '#c98f56'
      },
      {
        id: 'assembly', kind: 'assembly', label: 'ASSEMBLY COUNTER',
        x: 840, y: 248, w: 408, h: 150,
        approach: { x: 1044, y: 422 }, color: '#a06a3b'
      },
      {
        id: 'crate-bun', kind: 'crate', ingredient: 'bun', label: 'BUNS',
        x: 280, y: 620, w: 160, h: 110,
        approach: { x: 360, y: 600 }, color: '#e8b25c'
      },
      {
        id: 'crate-patty', kind: 'crate', ingredient: 'patty', label: 'PATTIES',
        x: 464, y: 620, w: 160, h: 110,
        approach: { x: 544, y: 600 }, color: '#8a5a33'
      },
      {
        id: 'crate-lettuce', kind: 'crate', ingredient: 'lettuce', label: 'LETTUCE',
        x: 648, y: 620, w: 160, h: 110,
        approach: { x: 728, y: 600 }, color: '#69b84f'
      },
      {
        id: 'crate-tomato', kind: 'crate', ingredient: 'tomato', label: 'TOMATOES',
        x: 832, y: 620, w: 160, h: 110,
        approach: { x: 912, y: 600 }, color: '#e14b3a'
      },
      {
        id: 'crate-cheese', kind: 'crate', ingredient: 'cheese', label: 'CHEESE',
        x: 1016, y: 620, w: 160, h: 110,
        approach: { x: 1096, y: 600 }, color: '#f6c945'
      }
    ];

    var floor = { x: 256, y: 80, w: 1008, h: 688 };
    var board = { x: 16, y: 80, w: 224, h: 560 };

    function stationAt(point) {
      for (var i = 0; i < stations.length; i++) {
        var s = stations[i];
        if (point.x >= s.x && point.x <= s.x + s.w &&
            point.y >= s.y && point.y <= s.y + s.h) {
          return s;
        }
      }
      return null;
    }

    function stationById(id) {
      for (var i = 0; i < stations.length; i++) {
        if (stations[i].id === id) return stations[i];
      }
      return null;
    }

    function clampToFloor(x, y, radius) {
      return {
        x: Math.max(floor.x + radius, Math.min(floor.x + floor.w - radius, x)),
        y: Math.max(floor.y + radius, Math.min(floor.y + floor.h - radius, y))
      };
    }

    // True when the point is inside a station rectangle (chef may not walk
    // through counters) — used to push the chef out.
    function collide(x, y, radius) {
      var pushed = { x: x, y: y, hit: false };
      for (var i = 0; i < stations.length; i++) {
        var s = stations[i];
        var nearestX = Math.max(s.x, Math.min(x, s.x + s.w));
        var nearestY = Math.max(s.y, Math.min(y, s.y + s.h));
        var dx = x - nearestX;
        var dy = y - nearestY;
        var distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
          pushed.hit = true;
          if (distSq === 0) {
            pushed.y = s.y + s.h + radius;
          } else {
            var dist = Math.sqrt(distSq);
            pushed.x = nearestX + (dx / dist) * radius;
            pushed.y = nearestY + (dy / dist) * radius;
          }
          x = pushed.x;
          y = pushed.y;
        }
      }
      return pushed;
    }

    return {
      stations: stations,
      floor: floor,
      board: board,
      stationAt: stationAt,
      stationById: stationById,
      clampToFloor: clampToFloor,
      collide: collide
    };
  }

  global.GoldenLadleKitchen = { makeKitchen: makeKitchen };
})(typeof window !== 'undefined' ? window : globalThis);
