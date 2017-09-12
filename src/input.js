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

if (MOBILE) {
  // FIXME impl mobile support
  addEventListener("touchstart", function(e) {
    e.preventDefault();
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
