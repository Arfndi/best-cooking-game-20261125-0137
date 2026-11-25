// The Golden Ladle — chef.js
// One job: the chef. Where they stand, what their hands hold, how the grill
// and the chopping board cook, and what happens at every station.
(function (global) {
  'use strict';

  function makeChef(config, kitchen, audio) {
    var grill = [
      { item: null, t: 0, state: 'empty' },
      { item: null, t: 0, state: 'empty' }
    ];
    var board = { item: null, t: 0, state: 'empty' };
    var assemblyPlate = null; // { items: [...] } or null

    var chef = {
      x: 640, y: 520,
      facingX: 0, facingY: 1,
      carrying: null, // null | {kind:'plate', items:[...]} | {kind:'item', item:'bun'|...}
      moving: false
    };

    function handsEmpty() { return chef.carrying === null; }

    function isPrepared(item) {
      return item === 'bun' || item === 'lettuce' || item === 'cheese' ||
        item === 'pattyCooked' || item === 'tomatoChopped';
    }

    // Advance the grill and the board by dt seconds. Returns event names
    // the caller should announce ('grill-done', 'burnt', 'chop-done').
    function updateStations(dt) {
      var events = [];
      var anyCooking = false;
      for (var i = 0; i < grill.length; i++) {
        var slot = grill[i];
        if (slot.state === 'cooking') {
          anyCooking = true;
          slot.t += dt;
          if (slot.t >= config.grillSeconds && slot.t - dt < config.grillSeconds) {
            slot.state = 'done';
            events.push('grill-done');
          } else if (slot.t >= config.burnAfterSeconds) {
            slot.state = 'burnt';
            events.push('burnt');
          }
        } else if (slot.state === 'done' || slot.state === 'burnt') {
          // Finished slots wait for pickup; they need no timer.
        }
      }
      if (anyCooking) audio.startSizzle();
      else audio.stopSizzle();
      if (board.state === 'chopping') {
        board.t += dt;
        if (board.t >= config.chopSeconds) {
          board.state = 'done';
          board.item = 'tomatoChopped';
          events.push('chop-done');
        }
      }
      return events;
    }

    function update(dt, input) {
      var dir = input.moveDirection();
      var target = input.moveTarget();
      var speed = config.chefSpeed;
      var moved = false;

      if (dir.active) {
        input.clearMoveTarget();
        chef.x += dir.x * speed * dt;
        chef.y += dir.y * speed * dt;
        chef.facingX = dir.x;
        chef.facingY = dir.y;
        moved = true;
      } else if (target) {
        var dx = target.x - chef.x;
        var dy = target.y - chef.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          input.clearMoveTarget();
          if (target.stationId) {
            return { arrivedAt: target.stationId };
          }
        } else {
          var step = Math.min(dist, speed * dt);
          chef.x += (dx / dist) * step;
          chef.y += (dy / dist) * step;
          chef.facingX = dx / dist;
          chef.facingY = dy / dist;
          moved = true;
        }
      }

      chef.moving = moved;
      var clamped = kitchen.clampToFloor(chef.x, chef.y, config.chefRadius);
      chef.x = clamped.x;
      chef.y = clamped.y;
      var pushed = kitchen.collide(chef.x, chef.y, config.chefRadius);
      chef.x = pushed.x;
      chef.y = pushed.y;
      return null;
    }

    // Try to use a station. Returns {ok, kind, hint} for the HUD.
    function interact(station, orders) {
      var kind = station.kind;
      var result = { ok: false, kind: kind, hint: '' };

      if (kind === 'crate') {
        if (!handsEmpty()) {
          result.hint = chef.carrying.kind === 'plate'
            ? 'Set the plate on the assembly counter first'
            : 'Hands full — serve, trash or plate it first';
          return result;
        }
        chef.carrying = { kind: 'item', item: station.ingredient };
        audio.pickup();
        result.ok = true;
        return result;
      }

      if (kind === 'plates') {
        if (!handsEmpty()) {
          result.hint = 'Hands full — put that down first';
          return result;
        }
        chef.carrying = { kind: 'plate', items: [] };
        audio.pickup();
        result.ok = true;
        return result;
      }

      if (kind === 'trash') {
        if (handsEmpty()) {
          result.hint = 'Nothing to throw away';
          return result;
        }
        chef.carrying = null;
        audio.place();
        result.ok = true;
        return result;
      }

      if (kind === 'grill') {
        if (!handsEmpty() && chef.carrying.kind === 'item' && chef.carrying.item === 'patty') {
          for (var i = 0; i < grill.length; i++) {
            if (grill[i].state === 'empty') {
              grill[i] = { item: 'patty', t: 0, state: 'cooking' };
              chef.carrying = null;
              audio.place();
              result.ok = true;
              return result;
            }
          }
          result.hint = 'Both grill slots are full';
          return result;
        }
        if (handsEmpty()) {
          for (var j = 0; j < grill.length; j++) {
            if (grill[j].state === 'done') {
              grill[j] = { item: null, t: 0, state: 'empty' };
              chef.carrying = { kind: 'item', item: 'pattyCooked' };
              audio.pickup();
              result.ok = true;
              return result;
            }
            if (grill[j].state === 'burnt') {
              grill[j] = { item: null, t: 0, state: 'empty' };
              audio.error();
              result.ok = true;
              result.hint = 'Burnt patty tossed';
              return result;
            }
          }
          result.hint = 'Nothing ready on the grill — raw patties go on first';
          return result;
        }
        result.hint = 'The grill only takes raw patties';
        return result;
      }

      if (kind === 'board') {
        if (!handsEmpty() && chef.carrying.kind === 'item' && chef.carrying.item === 'tomato') {
          if (board.state !== 'empty') {
            result.hint = 'The board is busy';
            return result;
          }
          board = { item: 'tomato', t: 0, state: 'chopping' };
          chef.carrying = null;
          audio.chop();
          result.ok = true;
          return result;
        }
        if (handsEmpty() && board.state === 'done') {
          board = { item: null, t: 0, state: 'empty' };
          chef.carrying = { kind: 'item', item: 'tomatoChopped' };
          audio.pickup();
          result.ok = true;
          return result;
        }
        if (handsEmpty() && board.state === 'chopping') {
          result.hint = 'Still chopping…';
          return result;
        }
        result.hint = 'The board only chops tomatoes';
        return result;
      }

      if (kind === 'assembly') {
        if (!handsEmpty() && chef.carrying.kind === 'plate') {
          if (assemblyPlate) {
            result.hint = 'A plate is already on the counter';
            return result;
          }
          assemblyPlate = chef.carrying;
          chef.carrying = null;
          audio.place();
          result.ok = true;
          return result;
        }
        if (!handsEmpty() && chef.carrying.kind === 'item') {
          var item = chef.carrying.item;
          if (!assemblyPlate) {
            result.hint = 'Put a plate on the counter first';
            return result;
          }
          if (!isPrepared(item)) {
            result.hint = item === 'patty'
              ? 'Grill the patty first'
              : 'Chop the tomato first';
            return result;
          }
          if (assemblyPlate.items.length >= 5) {
            result.hint = 'The plate is full';
            return result;
          }
          assemblyPlate.items.push(item);
          chef.carrying = null;
          audio.place();
          result.ok = true;
          return result;
        }
        if (handsEmpty() && assemblyPlate) {
          chef.carrying = assemblyPlate;
          assemblyPlate = null;
          audio.pickup();
          result.ok = true;
          return result;
        }
        result.hint = 'Bring a plate or an ingredient';
        return result;
      }

      if (kind === 'serve') {
        if (handsEmpty() || chef.carrying.kind !== 'plate') {
          result.hint = 'Bring a finished plate to the window';
          return result;
        }
        var plate = chef.carrying;
        if (plate.items.length === 0) {
          result.hint = 'An empty plate earns nothing';
          return result;
        }
        var match = orders.findMatch(plate.items);
        if (!match) {
          result.hint = 'No order wants this plate — check the board';
          return result;
        }
        var patienceLeft = match.patience / match.patienceMax;
        var tip = Math.round(match.recipe.price * config.tipMaxFraction * patienceLeft);
        chef.carrying = null;
        orders.serve(match);
        audio.serve();
        result.ok = true;
        result.served = { order: match, coins: match.recipe.price + tip, tip: tip };
        return result;
      }

      result.hint = 'Nothing to do here';
      return result;
    }

    function nearestStation() {
      var best = null;
      var bestDist = Infinity;
      for (var i = 0; i < kitchen.stations.length; i++) {
        var s = kitchen.stations[i];
        var cx = s.x + s.w / 2;
        var cy = s.y + s.h / 2;
        var dx = chef.x - cx;
        var dy = chef.y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = s;
        }
      }
      return bestDist <= config.interactRange + 90 ? best : null;
    }

    function reset() {
      grill[0] = { item: null, t: 0, state: 'empty' };
      grill[1] = { item: null, t: 0, state: 'empty' };
      board = { item: null, t: 0, state: 'empty' };
      assemblyPlate = null;
      chef.x = 640;
      chef.y = 520;
      chef.facingX = 0;
      chef.facingY = 1;
      chef.carrying = null;
      chef.moving = false;
    }

    return {
      chef: chef,
      grill: grill,
      board: function () { return board; },
      assemblyPlate: function () { return assemblyPlate; },
      setAssemblyPlate: function (plate) { assemblyPlate = plate; },
      setGrillSlot: function (i, slot) { grill[i] = slot; },
      setBoard: function (state) { board = state; },
      update: update,
      updateStations: updateStations,
      interact: interact,
      nearestStation: nearestStation,
      reset: reset
    };
  }

  global.GoldenLadleChef = { makeChef: makeChef };
})(typeof window !== 'undefined' ? window : globalThis);
