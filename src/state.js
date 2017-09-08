/* global W H initState */

// N.B: constants don't live here

var t = 0,
  dt,
  // Input state : updated by user events, handled & emptied by the update loop
  keys = {},
  tap,
  gameState = initState();
