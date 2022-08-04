var context = new AudioContext();
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
  masterGainNode.gain.value = 0.5
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
      gainNode[i].gain.value = 0.15

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
  lop.frequency.linearRampToValueAtTime(parseFloat(freq), context.currentTime +0.05);
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

export { play, processNotes, updateGain, updateOsc, initAudio, stop, updateLop, updateOscType }
