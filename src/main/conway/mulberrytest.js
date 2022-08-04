function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function mulberryTest() {
  var random = mulberry32(123456789)
  function callRandom() {
    for (let i = 0; i < 100; i++) {
      console.log(random())
    }
  }

  console.time('callRandom')
  callRandom()
  console.timeEnd('callRandom')
}

// > mulberryTest()
// callRandom: 30.706ms
