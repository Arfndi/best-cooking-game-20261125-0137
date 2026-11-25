// The Golden Ladle — shots.js
// One job: stage deterministic scenes for screenshots, and run a scripted
// self-test through the real game functions. A staged scene freezes the
// timers so the render is identical on every load with the same query.
(function (global) {
  'use strict';

  function recipeById(config, id) {
    for (var i = 0; i < config.recipes.length; i++) {
      if (config.recipes[i].id === id) return config.recipes[i];
    }
    return config.recipes[0];
  }

  function makeOrder(config, id, recipeId, patience) {
    var recipe = recipeById(config, recipeId);
    return {
      id: id,
      recipe: recipe,
      patience: patience,
      patienceMax: patience,
      bornAt: 0,
      state: 'open'
    };
  }

  function placeChefAt(world, stationId) {
    var station = world.kitchen.stationById(stationId);
    world.chef.x = station.approach.x;
    world.chef.y = station.approach.y;
    world.chef.facingX = 0;
    world.chef.facingY = -1;
  }

  function stageShot(world, name) {
    var config = world.config;
    var orders = world.orders;
    var chef = world.chefModule;
    orders.reset();
    chef.reset();
    world.floaters.length = 0;
    world.hint = null;
    world.flash = { color: '#000000', t: 0 };
    world.serveGlow = 0;
    world.frozen = true;
    world.combo = 1;
    world.bestCombo = 1;

    if (name === 'cover') {
      // Mid-rush: the kitchen at its busiest, every required element visible.
      world.phase = 'playing';
      world.time = 75;
      world.timeLeft = 75;
      world.coins = 86;
      world.combo = 3;
      world.bestCombo = 3;
      orders.all().push(makeOrder(config, 7, 'burger', 26));
      orders.all().push(makeOrder(config, 8, 'salad', 18));
      orders.all().push(makeOrder(config, 9, 'melt', 34));
      chef.setGrillSlot(0, { item: 'patty', t: 2.4, state: 'cooking' });
      chef.setGrillSlot(1, { item: 'patty', t: 4.2, state: 'done' });
      chef.setBoard({ item: 'tomato', t: 0.8, state: 'chopping' });
      chef.setAssemblyPlate({ items: ['lettuce', 'tomatoChopped'] });
      // Mid-walk on the open floor, plate held out to the side, so the
      // assembly counter's label stays readable.
      world.chef.x = 640;
      world.chef.y = 560;
      world.chef.facingX = 0;
      world.chef.facingY = -1;
      world.chef.carrying = { kind: 'plate', items: ['bun', 'pattyCooked'] };
      world.hint = { text: 'Build the burger on the counter, then serve it', t: 999 };
    } else if (name === 'start') {
      world.phase = 'title';
      world.time = 0;
      world.timeLeft = config.shiftSeconds;
      world.coins = 0;
      orders.all().push(makeOrder(config, 1, 'salad', 44));
      // Clear of the title panel, on the open floor by the cheese crate.
      world.chef.x = 1150;
      world.chef.y = 690;
      world.chef.facingX = 0;
      world.chef.facingY = -1;
    } else if (name === 'serve') {
      // A finished Classic Burger at the window, timer running, coins banked.
      world.phase = 'playing';
      world.time = 102;
      world.timeLeft = 48;
      world.coins = 142;
      world.combo = 5;
      world.bestCombo = 5;
      orders.all().push(makeOrder(config, 11, 'veggie', 30));
      orders.all().push(makeOrder(config, 12, 'salad', 12));
      chef.setGrillSlot(0, { item: 'patty', t: 1.2, state: 'cooking' });
      chef.setBoard({ item: null, t: 0, state: 'empty' });
      chef.setAssemblyPlate({ items: ['bun', 'lettuce'] });
      placeChefAt(world, 'serve');
      world.chef.carrying = { kind: 'plate', items: ['bun', 'pattyCooked', 'lettuce'] };
      world.serveGlow = 1;
      world.floaters.push({ x: 980, y: 225, text: '+21', color: '#3f7d2e', t: 0.2, life: 1.4 });
    } else if (name === 'results') {
      world.phase = 'over';
      world.time = config.shiftSeconds;
      world.timeLeft = 0;
      world.coins = 214;
      world.served = 14;
      world.lost = 2;
      world.bestCombo = 6;
      world.combo = 6;
      world.stars = 2;
      world.grade = 'A';
      orders.all().push(makeOrder(config, 14, 'double', 20));
      placeChefAt(world, 'assembly');
    } else {
      // Unknown shot name: fall back to the title scene.
      world.phase = 'title';
      world.time = 0;
      world.timeLeft = config.shiftSeconds;
      world.coins = 0;
    }
    world.frozen = true;
  }

  // Play the game for real, through the same functions a player uses:
  // plate, bun, grill a patty, chop nothing, assemble a Classic Burger,
  // serve it. Returns a result object; the caller reports it.
  function runSelfTest(world) {
    var log = [];
    function step(label, fn) {
      var result = fn();
      log.push(label + ': ' + JSON.stringify(result));
      return result;
    }
    try {
      world.orders.reset();
      world.chefModule.reset();
      world.phase = 'playing';
      world.time = 0;
      world.timeLeft = world.config.shiftSeconds;
      world.coins = 0;
      world.served = 0;
      world.lost = 0;
      world.combo = 1;
      world.orders.all().push(makeOrder(world.config, 1, 'burger', 40));

      step('take-plate', function () {
        placeChefAt(world, 'plates');
        return world.chefModule.interact(world.kitchen.stationById('plates'), world.orders);
      });
      step('plate-on-counter', function () {
        placeChefAt(world, 'assembly');
        return world.chefModule.interact(world.kitchen.stationById('assembly'), world.orders);
      });
      step('take-bun', function () {
        placeChefAt(world, 'crate-bun');
        return world.chefModule.interact(world.kitchen.stationById('crate-bun'), world.orders);
      });
      step('bun-on-plate', function () {
        placeChefAt(world, 'assembly');
        return world.chefModule.interact(world.kitchen.stationById('assembly'), world.orders);
      });
      step('take-patty', function () {
        placeChefAt(world, 'crate-patty');
        return world.chefModule.interact(world.kitchen.stationById('crate-patty'), world.orders);
      });
      step('patty-on-grill', function () {
        placeChefAt(world, 'grill');
        return world.chefModule.interact(world.kitchen.stationById('grill'), world.orders);
      });
      // Fast-forward the grill through the real timer.
      for (var i = 0; i < 60; i++) world.chefModule.updateStations(0.1);
      step('take-cooked-patty', function () {
        placeChefAt(world, 'grill');
        return world.chefModule.interact(world.kitchen.stationById('grill'), world.orders);
      });
      step('patty-on-plate', function () {
        placeChefAt(world, 'assembly');
        return world.chefModule.interact(world.kitchen.stationById('assembly'), world.orders);
      });
      step('take-lettuce', function () {
        placeChefAt(world, 'crate-lettuce');
        return world.chefModule.interact(world.kitchen.stationById('crate-lettuce'), world.orders);
      });
      step('lettuce-on-plate', function () {
        placeChefAt(world, 'assembly');
        return world.chefModule.interact(world.kitchen.stationById('assembly'), world.orders);
      });
      step('pick-up-plate', function () {
        placeChefAt(world, 'assembly');
        return world.chefModule.interact(world.kitchen.stationById('assembly'), world.orders);
      });
      var served = step('serve', function () {
        placeChefAt(world, 'serve');
        return world.chefModule.interact(world.kitchen.stationById('serve'), world.orders);
      });

      var pass = served && served.ok && served.served && served.served.coins >= 14 &&
        world.orders.openOrders().length === 0;
      return {
        pass: pass,
        coins: served && served.served ? served.served.coins : 0,
        log: log
      };
    } catch (err) {
      return { pass: false, coins: 0, log: log.concat(['EXCEPTION: ' + err.message]) };
    }
  }

  global.GoldenLadleShots = { stageShot: stageShot, runSelfTest: runSelfTest };
})(typeof window !== 'undefined' ? window : globalThis);
