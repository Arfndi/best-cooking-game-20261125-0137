// The Golden Ladle — orders.js
// One job: the order board. Spawning orders on a rising curve, counting
// each ticket's patience down, and deciding whether a finished plate
// matches an open order.
(function (global) {
  'use strict';

  function makeOrders(config, rng) {
    var orders = [];
    var nextId = 1;
    var spawnTimer = config.firstOrderAt;
    var elapsed = 0;

    function unlockedRecipes(now) {
      return config.recipes.filter(function (recipe) {
        return !recipe.unlockAt || now >= recipe.unlockAt;
      });
    }

    function spawnInterval(now) {
      var t = Math.min(1, now / config.shiftSeconds);
      return config.spawnIntervalStart +
        (config.spawnIntervalEnd - config.spawnIntervalStart) * t;
    }

    function patienceFor(now) {
      var t = Math.min(1, now / config.shiftSeconds);
      return config.patienceStart + (config.patienceEnd - config.patienceStart) * t;
    }

    function spawn(now) {
      var pool = unlockedRecipes(now);
      var recipe = pool[Math.floor(rng() * pool.length)];
      var patience = patienceFor(now);
      orders.push({
        id: nextId++,
        recipe: recipe,
        patience: patience,
        patienceMax: patience,
        bornAt: now,
        state: 'open' // open | served | expired
      });
    }

    // Advance the board by dt seconds. Returns the orders that expired
    // during this step, so the caller can score the failure.
    function update(dt, now) {
      elapsed = now;
      var expired = [];
      spawnTimer -= dt;
      if (spawnTimer <= 0 && orders.filter(isOpen).length < config.maxOrders) {
        spawn(now);
        spawnTimer = spawnInterval(now);
      }
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        if (order.state !== 'open') continue;
        order.patience -= dt;
        if (order.patience <= 0) {
          order.patience = 0;
          order.state = 'expired';
          order.expiredAt = now;
          expired.push(order);
        }
      }
      // Expired tickets linger briefly for their red flash, then leave.
      orders = orders.filter(function (order) {
        if (order.state !== 'expired') return true;
        return (now - order.expiredAt) < 1.2;
      });
      return expired;
    }

    function isOpen(order) {
      return order.state === 'open';
    }

    function openOrders() {
      return orders.filter(isOpen);
    }

    // A plate is a list of prepared item ids. It matches an order when the
    // multisets are equal, ignoring order.
    function plateMatches(plateItems, recipe) {
      if (plateItems.length !== recipe.items.length) return false;
      var have = plateItems.slice().sort();
      var want = recipe.items.slice().sort();
      for (var i = 0; i < want.length; i++) {
        if (have[i] !== want[i]) return false;
      }
      return true;
    }

    function findMatch(plateItems) {
      var open = openOrders();
      for (var i = 0; i < open.length; i++) {
        if (plateMatches(plateItems, open[i].recipe)) return open[i];
      }
      return null;
    }

    function serve(order) {
      order.state = 'served';
      orders = orders.filter(function (o) { return o !== order; });
    }

    function reset() {
      orders = [];
      nextId = 1;
      spawnTimer = config.firstOrderAt;
      elapsed = 0;
    }

    return {
      update: update,
      openOrders: openOrders,
      findMatch: findMatch,
      serve: serve,
      reset: reset,
      all: function () { return orders; },
      spawnForTest: spawn
    };
  }

  global.GoldenLadleOrders = { makeOrders: makeOrders };
})(typeof window !== 'undefined' ? window : globalThis);
