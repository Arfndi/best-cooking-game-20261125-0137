// The Golden Ladle — input.js
// One job: read the keyboard and the mouse and turn them into game intents:
// a movement direction, an interact press, a click-to-walk target.
(function (global) {
  'use strict';

  function makeInput(canvas) {
    var keys = {};
    var moveTarget = null; // {x, y, stationId} in canvas coordinates, or null
    var interactPressed = false;
    var anyKeyPressed = false;

    function canvasPoint(event) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    function onKeyDown(event) {
      var key = event.key;
      if (key === ' ' || key.indexOf('Arrow') === 0) event.preventDefault();
      if (!keys[key]) {
        anyKeyPressed = true;
        if (key === 'e' || key === 'E' || key === ' ' || key === 'Enter') {
          interactPressed = true;
        }
      }
      keys[key] = true;
    }

    function onKeyUp(event) {
      keys[event.key] = false;
    }

    function onMouseDown(event) {
      var point = canvasPoint(event);
      moveTarget = { x: point.x, y: point.y, stationId: null };
      anyKeyPressed = true;
    }

    function onBlur() {
      keys = {};
    }

    canvas.addEventListener('mousedown', onMouseDown);
    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', onBlur);

    function moveDirection() {
      var dx = 0;
      var dy = 0;
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
      if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;
      if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
      if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
      if (dx !== 0 && dy !== 0) {
        var len = Math.sqrt(2);
        dx /= len;
        dy /= len;
      }
      return { x: dx, y: dy, active: dx !== 0 || dy !== 0 };
    }

    return {
      moveDirection: moveDirection,
      consumeInteract: function () {
        var pressed = interactPressed;
        interactPressed = false;
        return pressed;
      },
      consumeAnyKey: function () {
        var pressed = anyKeyPressed;
        anyKeyPressed = false;
        return pressed;
      },
      moveTarget: function () { return moveTarget; },
      setMoveTargetStation: function (stationId) {
        if (moveTarget) moveTarget.stationId = stationId;
      },
      clearMoveTarget: function () { moveTarget = null; },
      setMoveTarget: function (target) { moveTarget = target; },
      isKeyDown: function (key) { return !!keys[key]; }
    };
  }

  global.GoldenLadleInput = { makeInput: makeInput };
})(typeof window !== 'undefined' ? window : globalThis);
