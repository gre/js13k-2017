/* global
keys
tap:true
MOBILE
c
d
gameOver
W
achievements:true
player:true
playingSince:true
awaitingContinue:true
*/

for (var i = 0; i < 99; ++i) keys[i] = 0;

var fullScreenRequested = 0;
function onTap(e) {
  if (MOBILE && !fullScreenRequested && d.webkitRequestFullScreen) {
    d.webkitRequestFullScreen();
    fullScreenRequested = 1;
  }

  var r = c.getBoundingClientRect(),
    x = e.clientX - r.left,
    y = e.clientY - r.top;

  console.log("TAP", x, y); // eslint-disable-line
  // FIXME it's not a tap game?
}

if (MOBILE) {
  addEventListener("touchstart", function(e) {
    e.preventDefault();
    onTap(e.changedTouches[0]);
  });
} else {
  addEventListener("click", function(e) {
    e.preventDefault();
    onTap(e);
  });
  addEventListener("keydown", function(e) {
    keys[e.which] = 1;
  });
  addEventListener("keyup", function(e) {
    keys[e.which] = 0;
  });
}
