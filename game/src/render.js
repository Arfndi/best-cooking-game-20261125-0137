// The Golden Ladle — render.js
// One job: draw everything. The kitchen, the stations, the food, the chef,
// the order board, the HUD and the screens. All art is drawn with canvas
// shapes — no image files, no network.
(function (global) {
  'use strict';

  function makeRender(config, kitchen) {
    var W = config.canvasWidth;
    var H = config.canvasHeight;
    var P = config.palette;

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function text(ctx, str, x, y, size, color, align, weight) {
      ctx.fillStyle = color || P.text;
      ctx.font = (weight || 'bold') + ' ' + size + 'px Arial, sans-serif';
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x, y);
    }

    function fmtTime(seconds) {
      var s = Math.max(0, Math.ceil(seconds));
      var m = Math.floor(s / 60);
      var r = s % 60;
      return m + ':' + (r < 10 ? '0' : '') + r;
    }

    // ---- food, drawn as vector shapes so the game needs no image files ----
    function drawIngredient(ctx, item, x, y, size) {
      var s = size / 2;
      ctx.save();
      ctx.translate(x, y);
      if (item === 'bun') {
        ctx.fillStyle = '#e8b25c';
        ctx.beginPath();
        ctx.arc(0, 2, s, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c98f3e';
        ctx.fillRect(-s, 2, s * 2, s * 0.35);
        ctx.fillStyle = '#fff3d6';
        ctx.beginPath();
        ctx.arc(-s * 0.4, -s * 0.4, 2, 0, Math.PI * 2);
        ctx.arc(s * 0.3, -s * 0.55, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item === 'patty') {
        ctx.fillStyle = '#8a5a33';
        roundRect(ctx, -s, -s * 0.55, s * 2, s * 1.1, 6);
        ctx.fill();
        ctx.fillStyle = '#6d4423';
        ctx.fillRect(-s * 0.7, -s * 0.2, s * 1.4, 3);
      } else if (item === 'pattyCooked') {
        ctx.fillStyle = '#5d3a1e';
        roundRect(ctx, -s, -s * 0.55, s * 2, s * 1.1, 6);
        ctx.fill();
        ctx.strokeStyle = '#3d2410';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.4);
        ctx.lineTo(-s * 0.2, s * 0.4);
        ctx.moveTo(s * 0.1, -s * 0.4);
        ctx.lineTo(s * 0.4, s * 0.4);
        ctx.stroke();
      } else if (item === 'lettuce') {
        ctx.fillStyle = '#69b84f';
        ctx.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = (i / 5) * Math.PI * 2;
          var r = i % 2 === 0 ? s : s * 0.62;
          var px = Math.cos(a) * r;
          var py = Math.sin(a) * r * 0.7;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3f7d2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(0, s * 0.5);
        ctx.stroke();
      } else if (item === 'tomato') {
        ctx.fillStyle = '#e14b3a';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#69b84f';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.9);
        ctx.lineTo(-s * 0.4, -s * 0.4);
        ctx.lineTo(s * 0.4, -s * 0.4);
        ctx.closePath();
        ctx.fill();
      } else if (item === 'tomatoChopped') {
        ctx.fillStyle = '#e14b3a';
        ctx.beginPath();
        ctx.arc(-s * 0.35, s * 0.15, s * 0.5, 0, Math.PI * 2);
        ctx.arc(s * 0.35, -s * 0.1, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f08578';
        ctx.beginPath();
        ctx.arc(-s * 0.35, s * 0.15, s * 0.22, 0, Math.PI * 2);
        ctx.arc(s * 0.35, -s * 0.1, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (item === 'cheese') {
        ctx.fillStyle = '#f6c945';
        ctx.beginPath();
        ctx.moveTo(-s, s * 0.6);
        ctx.lineTo(s, s * 0.6);
        ctx.lineTo(s, -s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c79a1d';
        ctx.beginPath();
        ctx.arc(-s * 0.3, s * 0.2, 3, 0, Math.PI * 2);
        ctx.arc(s * 0.4, -s * 0.1, 3, 0, Math.PI * 2);
        ctx.arc(0, s * 0.35, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPlate(ctx, items, x, y, size) {
      var s = size / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9c2b4';
      ctx.lineWidth = 2;
      ctx.stroke();
      var n = items.length;
      for (var i = 0; i < n; i++) {
        var iy = -6 - i * 7;
        ctx.save();
        ctx.translate(0, iy);
        ctx.scale(0.85, 0.85);
        drawIngredient(ctx, items[i], 0, 0, size * 0.62);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawProgressRing(ctx, x, y, r, fraction, color) {
      ctx.save();
      ctx.strokeStyle = 'rgba(46,42,38,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawStation(ctx, station, world) {
      var s = station;
      ctx.save();
      ctx.fillStyle = P.counterWood;
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.fill();
      ctx.fillStyle = P.counterTop;
      roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, 26, 8);
      ctx.fill();
      ctx.strokeStyle = P.counterEdge;
      ctx.lineWidth = 3;
      roundRect(ctx, s.x, s.y, s.w, s.h, 12);
      ctx.stroke();
      text(ctx, s.label, s.x + s.w / 2, s.y + 17, 13, '#5d3a1e', 'center');

      if (s.kind === 'crate') {
        for (var i = 0; i < 3; i++) {
          drawIngredient(ctx, s.ingredient, s.x + 40 + i * 40, s.y + s.h - 42, 44);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(s.x + 8, s.y + s.h - 14, s.w - 16, 6);
      } else if (s.kind === 'grill') {
        for (var j = 0; j < world.grill.length; j++) {
          var slot = world.grill[j];
          var gx = s.x + 55 + j * 110;
          var gy = s.y + 78;
          ctx.fillStyle = slot.state === 'empty' ? P.grillOff : '#3a3a40';
          roundRect(ctx, gx - 42, gy - 26, 84, 52, 8);
          ctx.fill();
          if (slot.state === 'cooking' || slot.state === 'done') {
            drawIngredient(ctx, slot.state === 'done' ? 'pattyCooked' : 'patty', gx, gy, 44);
            drawProgressRing(ctx, gx + 34, gy - 18, 9,
              Math.min(1, slot.t / config.grillSeconds),
              slot.state === 'done' ? '#69b84f' : '#f6c945');
          } else if (slot.state === 'burnt') {
            ctx.fillStyle = '#1c1a18';
            roundRect(ctx, gx - 20, gy - 12, 40, 24, 6);
            ctx.fill();
            text(ctx, 'BURNT', gx, gy - 32, 11, '#e14b3a', 'center');
          } else {
            text(ctx, 'EMPTY', gx, gy, 11, '#8a8a92', 'center');
          }
        }
      } else if (s.kind === 'board') {
        var board = world.board;
        ctx.fillStyle = '#e8d9b0';
        roundRect(ctx, s.x + 30, s.y + 52, s.w - 60, 56, 8);
        ctx.fill();
        if (board.state === 'chopping') {
          drawIngredient(ctx, 'tomato', s.x + s.w / 2, s.y + 80, 40);
          drawProgressRing(ctx, s.x + s.w / 2 + 52, s.y + 80, 12,
            Math.min(1, board.t / config.chopSeconds), '#e14b3a');
          text(ctx, 'CHOPPING…', s.x + s.w / 2, s.y + s.h - 14, 11, '#5d3a1e', 'center');
        } else if (board.state === 'done') {
          drawIngredient(ctx, 'tomatoChopped', s.x + s.w / 2, s.y + 80, 40);
          text(ctx, 'READY!', s.x + s.w / 2, s.y + s.h - 14, 11, '#3f7d2e', 'center');
        } else {
          text(ctx, 'Drop a tomato here', s.x + s.w / 2, s.y + 80, 12, '#7a6a58', 'center');
        }
      } else if (s.kind === 'assembly') {
        var plate = world.assemblyPlate;
        if (plate) {
          drawPlate(ctx, plate.items, s.x + s.w / 2, s.y + 92, 96);
          text(ctx, plate.items.length + ' / 5 on the plate', s.x + s.w / 2, s.y + s.h - 14, 12, '#5d3a1e', 'center');
        } else {
          ctx.strokeStyle = 'rgba(93,58,30,0.5)';
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(s.x + s.w / 2, s.y + 92, 52, 18, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, 'Put a plate here, then build the dish', s.x + s.w / 2, s.y + s.h - 14, 12, '#7a6a58', 'center');
        }
      } else if (s.kind === 'plates') {
        for (var p = 0; p < 3; p++) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(s.x + s.w / 2, s.y + 62 + p * 12, 44, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c9c2b4';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        text(ctx, 'Take a plate', s.x + s.w / 2, s.y + s.h - 14, 12, '#5d3a1e', 'center');
      } else if (s.kind === 'trash') {
        ctx.fillStyle = '#6d6d75';
        roundRect(ctx, s.x + 38, s.y + 44, s.w - 76, 56, 8);
        ctx.fill();
        ctx.fillStyle = '#8a8a92';
        ctx.fillRect(s.x + 30, s.y + 38, s.w - 60, 10);
        text(ctx, 'Dump what you hold', s.x + s.w / 2, s.y + s.h - 14, 12, '#e8e2d4', 'center');
      } else if (s.kind === 'serve') {
        var glow = world.serveGlow > 0 ? world.serveGlow : 0;
        ctx.fillStyle = '#3f7d2e';
        roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 34, 8);
        ctx.fill();
        if (glow > 0) {
          ctx.fillStyle = 'rgba(246,201,69,' + Math.min(1, glow) + ')';
          roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 34, 8);
          ctx.fill();
        }
        ctx.fillStyle = '#fdf6e3';
        ctx.beginPath();
        ctx.arc(s.x + 26, s.y + 57, 9, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, 'SERVE HERE', s.x + s.w / 2, s.y + 57, 11, '#2e2a26', 'center');
      }
      ctx.restore();
    }

    function drawChef(ctx, chef) {
      var bob = chef.moving ? Math.sin(chef.walkPhase || 0) * 2 : 0;
      ctx.save();
      ctx.translate(chef.x, chef.y + bob);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.beginPath();
      ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // body: apron
      ctx.fillStyle = '#fdf6e3';
      roundRect(ctx, -16, -6, 32, 26, 10);
      ctx.fill();
      ctx.fillStyle = '#e14b3a';
      ctx.fillRect(-16, 8, 32, 5);
      // head
      ctx.fillStyle = '#f2c89b';
      ctx.beginPath();
      ctx.arc(0, -18, 13, 0, Math.PI * 2);
      ctx.fill();
      // chef hat
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8, -28, 8, 0, Math.PI * 2);
      ctx.arc(0, -32, 9, 0, Math.PI * 2);
      ctx.arc(8, -28, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-12, -30, 24, 7);
      // eyes face the movement direction
      ctx.fillStyle = '#2e2a26';
      var ex = chef.facingX * 3;
      ctx.beginPath();
      ctx.arc(-5 + ex, -18, 2, 0, Math.PI * 2);
      ctx.arc(5 + ex, -18, 2, 0, Math.PI * 2);
      ctx.fill();
      // The carried item is held out to the side the chef faces, so it never
      // covers the station the chef stands at.
      if (chef.carrying) {
        var carryX = 0;
        var carryY = -48;
        if (chef.facingX !== 0) {
          carryX = chef.facingX * 36;
          carryY = -24;
        } else if (chef.facingY < 0) {
          carryX = 34;
          carryY = -24;
        }
        if (chef.carrying.kind === 'plate') {
          drawPlate(ctx, chef.carrying.items, carryX, carryY, 52);
        } else {
          drawIngredient(ctx, chef.carrying.item, carryX, carryY, 34);
        }
      }
      ctx.restore();
    }

    function drawOrderTicket(ctx, order, x, y, w, h) {
      var recipe = order.recipe;
      var frac = Math.max(0, order.patience / order.patienceMax);
      var urgent = frac < 0.3;
      ctx.save();
      ctx.fillStyle = order.state === 'expired' ? '#e8b0a8' : P.boardPaper;
      roundRect(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#e14b3a' : '#c9b896';
      ctx.lineWidth = urgent ? 3 : 2;
      roundRect(ctx, x, y, w, h, 10);
      ctx.stroke();
      // Full name on its own line; the price moves down to the timer row.
      ctx.font = 'bold 13px Arial, sans-serif';
      var nameText = '#' + order.id + '  ' + recipe.name.toUpperCase();
      var maxNameW = w - 24;
      while (ctx.measureText(nameText).width > maxNameW && nameText.length > 6) {
        nameText = nameText.slice(0, -1);
      }
      ctx.fillStyle = P.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, x + 12, y + 18);
      // recipe icons in a row
      var ix = x + 22;
      var seen = {};
      for (var i = 0; i < recipe.items.length; i++) {
        var item = recipe.items[i];
        drawIngredient(ctx, item, ix, y + 48, 32);
        var count = 0;
        for (var j = 0; j < recipe.items.length; j++) {
          if (recipe.items[j] === item) count++;
        }
        if (count > 1 && !seen[item]) {
          text(ctx, 'x' + count, ix + 15, y + 62, 12, P.text, 'left');
          seen[item] = true;
        }
        ix += 40;
      }
      // patience bar
      ctx.fillStyle = 'rgba(46,42,38,0.18)';
      roundRect(ctx, x + 12, y + h - 12, w - 24, 8, 4);
      ctx.fill();
      ctx.fillStyle = urgent ? '#e14b3a' : (frac < 0.6 ? '#f6c945' : '#69b84f');
      roundRect(ctx, x + 12, y + h - 12, (w - 24) * frac, 8, 4);
      ctx.fill();
      text(ctx, recipe.price + ' coins', x + 12, y + h - 22, 12, '#3f7d2e', 'left');
      text(ctx, fmtTime(order.patience), x + w - 10, y + h - 22, 12, urgent ? '#e14b3a' : P.muted, 'right');
      if (order.state === 'expired') {
        text(ctx, 'TOO LATE', x + w / 2, y + h / 2, 20, '#a82c20', 'center');
      }
      ctx.restore();
    }

    function drawHud(ctx, world) {
      ctx.save();
      ctx.fillStyle = P.hud;
      ctx.fillRect(0, 0, W, 64);
      text(ctx, 'THE GOLDEN LADLE', 20, 33, 24, P.gold, 'left');
      var timeText = fmtTime(world.timeLeft);
      var timeColor = world.timeLeft <= 30 ? '#ff8a7a' : P.hudText;
      text(ctx, 'SHIFT  ' + timeText, W / 2, 33, 26, timeColor, 'center');
      text(ctx, 'COINS  ' + world.coins, W - 330, 33, 22, P.hudText, 'left');
      text(ctx, 'COMBO x' + Math.max(1, world.combo), W - 170, 33, 22,
        world.combo >= 3 ? P.gold : P.hudText, 'left');
      if (world.muted) text(ctx, 'MUTED (M)', W - 20, 58, 11, P.muted, 'right');
      ctx.restore();
    }

    function drawFloaters(ctx, world) {
      for (var i = 0; i < world.floaters.length; i++) {
        var f = world.floaters[i];
        var alpha = Math.max(0, 1 - f.t / f.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        text(ctx, f.text, f.x, f.y - f.t * 40, 22, f.color, 'center');
        ctx.restore();
      }
    }

    function drawHint(ctx, world) {
      if (!world.hint || world.hint.t <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, world.hint.t);
      ctx.fillStyle = 'rgba(46,42,38,0.85)';
      var label = world.hint.text;
      ctx.font = 'bold 16px Arial, sans-serif';
      var tw = ctx.measureText(label).width;
      roundRect(ctx, W / 2 - tw / 2 - 16, H - 56, tw + 32, 34, 10);
      ctx.fill();
      text(ctx, label, W / 2, H - 38, 16, '#fdf6e3', 'center');
      ctx.restore();
    }

    function drawTitle(ctx, world) {
      ctx.save();
      ctx.fillStyle = 'rgba(46,42,38,0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.boardPaper;
      roundRect(ctx, W / 2 - 360, 150, 720, 440, 18);
      ctx.fill();
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 4;
      roundRect(ctx, W / 2 - 360, 150, 720, 440, 18);
      ctx.stroke();
      text(ctx, 'THE GOLDEN LADLE', W / 2, 220, 44, P.text, 'center');
      text(ctx, 'A hearth-kitchen rush — cook, plate, serve before the orders run out', W / 2, 262, 17, P.muted, 'center');
      var lines = [
        'WASD or ARROWS — move the chef      •      MOUSE — click to walk',
        'E or SPACE — use the station in front of you      •      P — pause      •      M — mute',
        'Take a plate, grill raw patties on the grill, chop tomatoes on the board,',
        'build each dish on the assembly counter, then serve it at the window.',
        'Tips grow while an order still has patience. Burnt food earns nothing.'
      ];
      for (var i = 0; i < lines.length; i++) {
        text(ctx, lines[i], W / 2, 316 + i * 30, 16, P.text, 'center');
      }
      var pulse = 0.6 + 0.4 * Math.sin(world.titlePulse || 0);
      ctx.globalAlpha = pulse;
      text(ctx, 'CLICK OR PRESS ENTER TO START YOUR SHIFT', W / 2, 540, 20, '#a82c20', 'center');
      ctx.globalAlpha = 1;
      text(ctx, '150-second shift  •  5 recipes  •  the Double Stack unlocks at 1:00', W / 2, 570, 14, P.muted, 'center');
      ctx.restore();
    }

    function drawResults(ctx, world) {
      ctx.save();
      ctx.fillStyle = 'rgba(46,42,38,0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P.boardPaper;
      roundRect(ctx, W / 2 - 330, 160, 660, 420, 18);
      ctx.fill();
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 4;
      roundRect(ctx, W / 2 - 330, 160, 660, 420, 18);
      ctx.stroke();
      text(ctx, 'SHIFT OVER', W / 2, 220, 40, P.text, 'center');
      var stars = '';
      for (var i = 0; i < 3; i++) stars += i < world.stars ? '★' : '☆';
      text(ctx, stars, W / 2, 272, 44, P.gold, 'center');
      text(ctx, 'Grade: ' + world.grade, W / 2, 316, 22, P.text, 'center');
      var rows = [
        'Coins earned:  ' + world.coins,
        'Dishes served:  ' + world.served,
        'Orders lost:  ' + world.lost,
        'Best combo:  x' + world.bestCombo
      ];
      for (var j = 0; j < rows.length; j++) {
        text(ctx, rows[j], W / 2, 360 + j * 32, 19, P.text, 'center');
      }
      text(ctx, 'Press R to cook another shift', W / 2, 540, 16, P.muted, 'center');
      ctx.restore();
    }

    function draw(ctx, world) {
      // floor
      ctx.fillStyle = P.wall;
      ctx.fillRect(0, 0, W, H);
      var tile = 64;
      for (var ty = 0; ty < 12; ty++) {
        for (var tx = 0; tx < 20; tx++) {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? P.floorA : P.floorB;
          ctx.fillRect(tx * tile, 80 + ty * tile, tile, tile);
        }
      }
      // order board panel
      ctx.fillStyle = P.board;
      roundRect(ctx, kitchen.board.x, kitchen.board.y, kitchen.board.w, kitchen.board.h, 12);
      ctx.fill();
      text(ctx, 'ORDER BOARD', kitchen.board.x + 14, kitchen.board.y + 22, 16, '#fdf6e3', 'left');
      var open = world.orders.openOrders();
      var expired = world.orders.all().filter(function (o) { return o.state === 'expired'; });
      var tickets = open.concat(expired).slice(0, 4);
      for (var i = 0; i < tickets.length; i++) {
        drawOrderTicket(ctx, tickets[i], kitchen.board.x + 12, kitchen.board.y + 40 + i * 106, kitchen.board.w - 24, 96);
      }
      if (tickets.length === 0) {
        text(ctx, 'No orders yet —', kitchen.board.x + kitchen.board.w / 2, kitchen.board.y + 120, 15, '#fdf6e3', 'center');
        text(ctx, 'the lunch rush is coming.', kitchen.board.x + kitchen.board.w / 2, kitchen.board.y + 144, 15, '#fdf6e3', 'center');
      }
      text(ctx, 'MENU', kitchen.board.x + 14, kitchen.board.y + 478, 13, '#fdf6e3', 'left');
      text(ctx, 'Salad 8 · Burger 14 · Melt 16', kitchen.board.x + 14, kitchen.board.y + 500, 11, '#cfc4ae', 'left');
      text(ctx, 'Veggie 18 · Double 26', kitchen.board.x + 14, kitchen.board.y + 518, 11, '#cfc4ae', 'left');
      text(ctx, 'Double Stack unlocks at 1:00', kitchen.board.x + 14, kitchen.board.y + 536, 11, '#cfc4ae', 'left');
      // stations
      for (var s = 0; s < kitchen.stations.length; s++) {
        drawStation(ctx, kitchen.stations[s], world);
      }
      // chef
      drawChef(ctx, world.chef);
      drawFloaters(ctx, world);
      drawHud(ctx, world);
      drawHint(ctx, world);
      if (world.flash && world.flash.t > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.45, world.flash.t);
        ctx.fillStyle = world.flash.color;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      if (world.phase === 'title') drawTitle(ctx, world);
      if (world.phase === 'paused') {
        ctx.save();
        ctx.fillStyle = 'rgba(46,42,38,0.6)';
        ctx.fillRect(0, 0, W, H);
        text(ctx, 'PAUSED — press P to keep cooking', W / 2, H / 2, 28, '#fdf6e3', 'center');
        ctx.restore();
      }
      if (world.phase === 'over') drawResults(ctx, world);
    }

    return {
      draw: draw,
      drawIngredient: drawIngredient,
      drawPlate: drawPlate,
      fmtTime: fmtTime
    };
  }

  global.GoldenLadleRender = { makeRender: makeRender };
})(typeof window !== 'undefined' ? window : globalThis);
