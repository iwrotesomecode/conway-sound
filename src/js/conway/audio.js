//const AudioContext = new window.AudioContext || window.webkitAudioContext
const context = new AudioContext()
// context.audioWorklet.addModule('Worklets.js').then(() => {
//   var Noise = new AudioWorkletNode(context, 'Noise');
// });

// const kick = () => { }
// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
const getSample = async (url, callback) => {
  audioBuffer = await fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer))
  callback(audioBuffer)
}

//const drumSample = "samples/353323__gunnbladez__100-distorto-drums-01.wav"

const _hihat = "samples/kit3/hihat.wav"
const _tom1 = "samples/kit3/tom1.wav"
const _tom2 = "samples/kit3/tom2.wav"
const _tom3 = "samples/kit3/tom3.wav"
const _snare = "samples/kit3/snare.wav"
const _kick = "samples/kit3/kick.wav"


const initSample = async (url) => {
  let buffer = await fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
  return buffer
}

var tom1, tom2, tom3, hihat, snare, kick
const initBuffer = async () => {
  const samples = [_hihat, _tom1, _tom2, _tom3, _snare, _kick];
  [hihat, tom1, tom2, tom3, snare, kick] = await Promise.all(samples.map(s => initSample(s)))
}

var PAN = 1;
const playSample = (rowNum, rowCount) => {
  let amp = context.createGain()
  let panner = context.createStereoPanner()
  panner.connect(masterGainNode) //context.destination
  amp.connect(panner)
  let audioBuffer;
  let volume = 0.2;
  switch (rowNum % 6) {
    case 0:
      audioBuffer = tom1
      break;
    case 1:
      audioBuffer = tom2
      break;
    case 2:
      audioBuffer = tom3
      break;
    case 3:
      audioBuffer = hihat
      panner.pan.setValueAtTime(PAN, context.currentTime)
      PAN = -1 * PAN
      break;
    case 4:
      audioBuffer = snare
      break;
    case 5:
      audioBuffer = kick
      break;
  }
  let player = context.createBufferSource()
  player.buffer = audioBuffer
  player.connect(amp)

  switch (true) {
    case (rowCount <= 2):
      volume = 0.05
      break;
    case (rowCount <= 4):
      volume = 0.2
      break;
    case (rowCount > 4):
      volume = 0.4
      break;
  }

  amp.gain.setValueAtTime(volume, context.currentTime)
  player.start(context.currentTime)
}

var oscNode = []
  , masterGainNode
  , gainNode = []
  , frequency = []
  , prevFrequency = []
  , clipFilter = []
  , panNode = []
  , lop
  , hip
  , delay
  , delayGain
  , delayLop
  , delayHip

const initAudio = () => {
  masterGainNode = context.createGain()
  masterGainNode.gain.value = 0.2
  lop = context.createBiquadFilter()
  lop.type = 'lowpass'
  lop.frequency.value = 4000
  hip = context.createBiquadFilter()
  hip.type = 'highpass'
  hip.frequency.value = 25

  delay = new DelayNode(context, { delayTime: 0.2 })
  delayGain = context.createGain()
  delayGain.gain.value = 0.6
  delay.connect(delayGain)
  delayLop = context.createBiquadFilter()
  delayLop.type = 'lowpass'
  delayHip = context.createBiquadFilter()
  delayHip.type = 'highpass'
  delayLop.frequency.value = 2000
  delayHip.frequency.value = 30
  delayGain.connect(delayLop)
  delayLop.connect(delayHip)
  delayHip.connect(masterGainNode)
  delayHip.connect(delay)
  lop.connect(hip)
  hip.connect(masterGainNode)
  hip.connect(delay)
  delayHip.connect(masterGainNode)

  for (let i = 0; i < 5; i++) {
    if (!oscNode[i]) {
      oscNode[i] = context.createOscillator()
      oscNode[i].type = 'sine'
      oscNode[i].frequency.value = 20
      oscNode[i].start()
      gainNode[i] = context.createGain()
      gainNode[i].gain.value = 0.05

      clipFilter[i] = context.createWaveShaper()
      clipFilter[i].curve = makeDistortionCurve()

      oscNode[i].connect(clipFilter[i])
      clipFilter[i].connect(gainNode[i])
      gainNode[i].connect(lop)
    }
  }

  console.table(tonalityLattice)
}

const play = () => {
  if (context.state === "suspended") context.resume();
  masterGainNode.connect(context.destination)
}

for (let i = 0; i < oscNode.length; i++) {
  panNode[i] = context.StereoPanner();
  panNode[i].pan.value = 0; // -1, 1
}


const stop = () => {
  if (oscNode.length !== 0) {
    setTimeout(() => {
      masterGainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.001)
      masterGainNode.disconnect(context.destination)
      masterGainNode = undefined
      for (let i = 0; i < oscNode.length; ++i) {
        oscNode[i].stop()
      }
      oscNode = []
      clipFilter = []
      gainNode = []
    }, 40)
  }
}

const makeDistortionCurve = (k = 40) => {
  let n_samples = 44100, curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    //let x = i * 2 / n_samples - 1;
    let x = (i - (n_samples / 2)) / (n_samples / 2)
    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    //curve[i] = 1.5*x - 0.5*Math.pow(x, 3)
  }
  return curve;
}

Array.matrix = (numrows, numcols, basefreq, rowRatio, colRatio) => {
  var arr = [];
  for (let i = 0; i < numrows; ++i) {
    var columns = [];
    for (let j = 0; j < numcols; ++j) {
      let note = basefreq * (rowRatio) ** (i) * (colRatio) ** (j);
      //columns[j] = reduceOctave(note);
      columns[j] = note
    }
    arr[i] = columns;
  }
  return arr;
}

const reduceOctave = (note, lower, upper) => {
  if (lower <= note <= upper) return note
  else if (note < lower) return reduceOctave(note * 2)
  return reduceOctave(note / 2)
}

var tonalityLattice = Array.matrix(4, 4, 60, 7 / 4, 3 / 2)

const processNotes = (array) => {
  switch (array.length) {
    case 16:
      frequency = processNotes16(array);
      updateOsc(frequency)
      break;
    case 256:
      processNotes256(array)
      break;
    case 1600:
      break;
  }
}

const processNotes16 = (array) => {
  return array.reduce((acc, el, idx) => 0 < el
    ? acc.concat(tonalityLattice[idx % 4][Math.floor(idx / 4)])
    : acc
    , [])
}

const chunkSize = 16
const processNotes256 = (array) => {
  for (let i = 0; i < array.length; i += chunkSize) {
    let chunk = array.slice(i, i + chunkSize)
    let rowCount = chunk.reduce((acc, el) => el == 1 ? acc + 1 : acc, 0)
    let rowNum = Math.floor(i / chunkSize)
    if (rowCount > 0) {
      playSample(rowNum, rowCount)
    }
  }
}

const idxToUpdate = (OldArray, NewArray) => {

}

const idxRemainSame = (OldArray, NewArray) => {

}

const idxToRemove = (OldArray, NewArray) => {

}

const updateOsc = (array) => {
  for (let i = 0; i < Math.min(array.length, oscNode.length); ++i) {
    oscNode[i].frequency.exponentialRampToValueAtTime(array[i], context.currentTime + 0.3)
    //oscNode[i].frequency.setValueAtTime(array[i], context.currentTime + 0.3)
  }
}



const updateGain = (value) => {
  masterGainNode.gain.value = parseFloat(value)
}


const updateLop = (freq) => {
  lop.frequency.linearRampToValueAtTime(parseFloat(freq), context.currentTime + 0.05);
  //delayLop.frequency.value = parseFloat(freq);
}

const updateOscType = (type) => {
  for (let i = 0; i < oscNode.length; ++i) {
    oscNode[i].type = type
  }
}

// get just frequencies from array
const difference = (setA, setB) => {
  let diff = new Set(setA)
  for (let element of setB) {
    diff.delete(element)
  }
  return diff
}

const compareFrequency = (oldArray, newArray) => {
  // for osc in oscillators, check if osc.frequency.value =
  let uniqueInNew = difference(oldArray, newArray)
  let uniqueInOld = difference(newArray, oldArray)
}

export { play, processNotes, updateGain, updateOsc, initAudio, stop, updateLop, updateOscType, initBuffer }
