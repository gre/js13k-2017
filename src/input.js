/* global
keys
MOBILE
*/

var keys = {};
for (var i = 0; i < 99; ++i) keys[i] = 0;

var touchId, touchTime, touchStartPos, touchMove;

function findTouch(list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].identifier === touchId) {
      return list[i];
    }
  }
  return null;
}
function touchPos(touch) {
  return [touch.clientX, touch.clientY]; //don't care about the canvas offset because we'll always do just diff
}

if (MOBILE) {
  addEventListener("touchstart", function(e) {
    if (touchId) return;
    e.preventDefault();
    var touch = e.changedTouches[0];
    touchId = touch.identifier;
    touchTime = Date.now();
    touchStartPos = touchPos(touch);
  });
  addEventListener("touchmove", function(e) {
    var touch = findTouch(e.changedTouches);
    if (touch) {
      e.preventDefault();
      touchMove = touchPos(touch);
    }
  });
  addEventListener("touchend", function(e) {
    var touch = findTouch(e.changedTouches);
    if (touch) {
      e.preventDefault();
      touchMove = touchId = touchStartPos = null;
    }
  });
  addEventListener("touchcancel", function(e) {
    var touch = findTouch(e.changedTouches);
    if (touch) {
      e.preventDefault();
      touchMove = touchId = touchStartPos = null;
    }
  });
} else {
  addEventListener("keydown", function(e) {
    if (e.which >= 37 && e.which <= 40) e.preventDefault();
    keys[e.which] = 1;
  });
  addEventListener("keyup", function(e) {
    if (e.which >= 37 && e.which <= 40) e.preventDefault();
    keys[e.which] = 0;
  });
}
