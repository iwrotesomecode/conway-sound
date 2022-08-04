registerProcessor('Pink', class extends AudioWorkletProcessor) {
    constructor() {super();}
    process(input, outputs) {
        let output = outputs[0][0];
        let white = []
        for (let i = 0; i< output.length; ++i) white[i] = 2*Math.random()-1;
        const b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]; // numerator, feedforward
        const a = [1, -2.494956002, 2.017265875, -0.522189400]; // denominator, feedback
        var iirNode = context.
        return true;
    }
}
