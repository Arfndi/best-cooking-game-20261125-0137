// The Golden Ladle — main.js
// One job: run the game. Owns the world state, the loop, the phases
// (title / playing / paused / over), scoring, and wiring input to the chef.
(function (global) {
  'use strict';

  var config = global.GOLDEN_LADLE_CONFIG;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var query = new URLSearchParams(global.location.search);
  var seed = parseInt(query.get('seed') || '1', 10) || 1;
  var rng = global.GoldenLadleRandom.makeSeededRandom(seed);

  var kitchen = global.GoldenLadleKitchen.makeKitchen();
  var audio = global.GoldenLadleAudio.makeAudio();
  var input = global.GoldenLadleInput.makeInput(canvas);
  var orders = global.GoldenLadleOrders.makeOrders(config, rng);
  var chefModule = global.GoldenLadleChef.makeChef(config, kitchen, audio);
  var render = global.GoldenLadleRender.makeRender(config, kitchen);

  var world = {
    config: config,
    kitchen: kitchen,
    orders: orders,
    chefModule: chefModule,
    chef: chefModule.chef,
    get grill() { return chefModule.grill; },
    get board() { return chefModule.board(); },
    get assemblyPlate() { return chefModule.assemblyPlate(); },
    phase: 'title',
    time: 0,
    timeLeft: config.shiftSeconds,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 1,
    bestCombo: 1,
    stars: 0,
    grade: '—',
    floaters: [],
    hint: null,
    flash: { color: '#000000', t: 0 },
    serveGlow: 0,
    muted: false,
    frozen: false,
    titlePulse: 0
  };

  function showHint(text) {
    world.hint = { text: text, t: 3 };
  }

  function addFloater(x, y, text, color) {
    world.floaters.push({ x: x, y: y, text: text, color: color, t: 0, life: 1.4 });
  }

  function finishShift() {
    world.phase = 'over';
    audio.stopSizzle();
    var coins = world.coins;
    world.stars = coins >= config.stars.three ? 3
      : coins >= config.stars.two ? 2
      : coins >= config.stars.one ? 1 : 0;
    world.grade = world.stars === 3 ? 'S'
      : world.stars === 2 ? 'A'
      : world.stars === 1 ? 'B' : 'C';
  }

  function startShift() {
    orders.reset();
    chefModule.reset();
    input.clearMoveTarget();
    world.phase = 'playing';
    world.time = 0;
    world.timeLeft = config.shiftSeconds;
    world.coins = 0;
    world.served = 0;
    world.lost = 0;
    world.combo = 1;
    world.bestCombo = 1;
    world.stars = 0;
    world.grade = '—';
    world.floaters = [];
    world.hint = null;
    world.flash = { color: '#000000', t: 0 };
    world.serveGlow = 0;
    world.frozen = false;
    audio.unlock();
  }

  function applyInteract(result, station) {
    if (result.ok && result.served) {
      var served = result.served;
      world.coins += served.coins;
      world.served += 1;
      world.combo += 1;
      if (world.combo > world.bestCombo) world.bestCombo = world.combo;
      addFloater(station.x + station.w / 2, station.y - 8,
        '+' + served.coins + (served.tip > 0 ? ' (tip ' + served.tip + ')' : ''), '#3f7d2e');
      world.serveGlow = 1;
      return;
    }
    if (result.ok) return;
    if (result.hint) {
      showHint(result.hint);
      audio.error();
    }
  }

  function interactAt(station) {
    if (!station) return;
    var result = chefModule.interact(station, orders);
    applyInteract(result, station);
  }

  function update(dt) {
    world.titlePulse += dt * 3;
    // A staged screenshot scene never advances: its timers, glow and
    // floaters stay exactly as staged.
    if (world.frozen) return;
    if (world.flash.t > 0) world.flash.t -= dt * 2;
    if (world.serveGlow > 0) world.serveGlow -= dt * 0.8;
    if (world.hint && world.hint.t > 0) world.hint.t -= dt;
    for (var i = world.floaters.length - 1; i >= 0; i--) {
      world.floaters[i].t += dt;
      if (world.floaters[i].t >= world.floaters[i].life) world.floaters.splice(i, 1);
    }
    if (world.chef.moving) world.chef.walkPhase = (world.chef.walkPhase || 0) + dt * 10;

    if (world.phase !== 'playing') return;

    world.time += dt;
    world.timeLeft = Math.max(0, config.shiftSeconds - world.time);

    var expired = orders.update(dt, world.time);
    if (expired.length > 0) {
      world.lost += expired.length;
      world.combo = 1;
      world.flash = { color: '#e14b3a', t: 0.5 };
      audio.expire();
      showHint('An order ran out of patience — combo reset');
    }

    var events = chefModule.updateStations(dt);
    for (var e = 0; e < events.length; e++) {
      if (events[e] === 'grill-done') audio.grillDone();
      if (events[e] === 'chop-done') audio.chopDone();
      if (events[e] === 'burnt') showHint('A patty burnt on the grill — toss it');
    }

    var arrival = chefModule.update(dt, input);
    if (arrival && arrival.arrivedAt) {
      interactAt(kitchen.stationById(arrival.arrivedAt));
    }
    if (input.consumeInteract()) {
      var nearest = chefModule.nearestStation();
      if (nearest) interactAt(nearest);
    }

    if (world.timeLeft <= 0) finishShift();
  }

  function onMouseDown(event) {
    audio.unlock();
    if (world.phase === 'title') {
      startShift();
      return;
    }
    if (world.phase === 'over') return;
    if (world.phase === 'paused') return;
    var rect = canvas.getBoundingClientRect();
    var point = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
    var station = kitchen.stationAt(point);
    if (station) {
      input.setMoveTarget({ x: station.approach.x, y: station.approach.y, stationId: station.id });
    } else {
      var clamped = kitchen.clampToFloor(point.x, point.y, config.chefRadius);
      input.setMoveTarget({ x: clamped.x, y: clamped.y, stationId: null });
    }
  }

  function onKeyDown(event) {
    var key = event.key;
    if (key === 'm' || key === 'M') {
      world.muted = audio.toggleMute();
      return;
    }
    if (world.phase === 'title' && (key === 'Enter' || key === ' ')) {
      audio.unlock();
      startShift();
      return;
    }
    if (world.phase === 'over' && (key === 'r' || key === 'R')) {
      startShift();
      return;
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      if (world.phase === 'playing') {
        world.phase = 'paused';
        audio.stopSizzle();
      } else if (world.phase === 'paused') {
        world.phase = 'playing';
      }
    }
  }

  canvas.addEventListener('mousedown', onMouseDown);
  global.addEventListener('keydown', onKeyDown);

  // Screenshot scenes and the self-test run before the first frame.
  var shotName = query.get('shot');
  if (shotName) {
    global.GoldenLadleShots.stageShot(world, shotName);
  }

  var last = 0;
  function frame(timestamp) {
    var dt = Math.min(0.05, (timestamp - last) / 1000 || 0);
    last = timestamp;
    update(dt);
    render.draw(ctx, world);
    global.requestAnimationFrame(frame);
  }
  global.requestAnimationFrame(frame);

  if (query.get('selftest') === '1') {
    global.setTimeout(function () {
      var result = global.GoldenLadleShots.runSelfTest(world);
      var title = result.pass
        ? 'SELFTEST PASS coins=' + result.coins
        : 'SELFTEST FAIL';
      document.title = title;
      var pre = document.createElement('pre');
      pre.id = 'selftest-result';
      pre.textContent = title + '\n' + result.log.join('\n');
      document.body.appendChild(pre);
    }, 300);
  }

  global.__goldenLadle = { world: world, startShift: startShift };
})(typeof window !== 'undefined' ? window : globalThis);
