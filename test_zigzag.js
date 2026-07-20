// ponytail: minimal self-check, run with `node test_zigzag.js`
global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

require("./game.js");

// lane clamping
window.moveTo(-5);
console.assert(window.getState().playerLane === 0, "moveTo should clamp below 0");
window.moveTo(99);
console.assert(window.getState().playerLane === LANES - 1, "moveTo should clamp above LANES-1");

// spawning over time
window.newGame();
for (let i = 0; i < 30; i++) window.tick(200);
console.assert(window.getState().obstacles.length > 0, "obstacles should spawn over time");

// collision detection: force an obstacle onto the player's lane at PLAYER_Y
window.newGame();
window.moveTo(1);
window.getState().obstacles.push({ lane: 1, y: PLAYER_Y });
window.tick(16);
console.assert(window.getState().over === true, "should detect collision on matching lane/row");

// no collision when obstacle is in a different lane
window.newGame();
window.moveTo(0);
window.getState().obstacles.push({ lane: 2, y: PLAYER_Y });
window.tick(16);
console.assert(window.getState().over === false, "should not collide across different lanes");

console.log("ZigZag self-check passed");
