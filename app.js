// Web Audio API setup
let audioContext;
let micStream;
let micSource;
let reverbNode;
let bypassNode;
let isBypassed = false;
let isProcessing = false;

// Presets
const presets = {
  shimmer: { decay: 5, diffusion: 0.8, modDepth: 0.5, modFreq: 2, tone: 5000, feedback: 0.7, nonlinearity: 0.4 },
  chaotic: { decay: 2, diffusion: 0.9, modDepth: 0.8, modFreq: 5, tone: 200, feedback: 0.8, nonlinearity: 0.7 },
  infinite: { decay: 8, diffusion: 0.6, modDepth: 0.3, modFreq: 0.5, tone: 1000, feedback: 0.9, nonlinearity: 0.3 },
  subtle: { decay: 1.5, diffusion: 0.5, modDepth: 0.1, modFreq: 1, tone: 2000, feedback: 0.4, nonlinearity: 0.1 },
  dronescape: { decay: 10, diffusion: 0.7, modDepth: 0.6, modFreq: 0.2, tone: 500, feedback: 0.6, nonlinearity: 0.5 }
};

// Helper function to create distortion curve
function makeDistortionCurve(amount) {
  const n = 44100;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * (1 + amount * 10)) / Math.tanh(1 + amount * 10);
  }
  return curve;
}

// Force audio to main speaker (mobile workaround)
async function forceMainSpeaker(context) {
  // Try setSinkId (Chrome 74+)
  if (context.setSinkId) {
    try {
      await context.setSinkId('default');
      console.log("Audio routed to default speaker (setSinkId).");
      return true;
    } catch (e) {
      console.warn("setSinkId failed:", e);
    }
  }

  // Fallback for iOS/Safari: Use a hidden audio element
  if (/iPad|iPhone|iPod|Android/.test(navigator.userAgent)) {
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(new Blob([new Uint8Array(1)], { type: 'audio/wav' }));
    audioElement.volume = 0.01; // Almost silent
    audioElement.play().catch(e => console.warn("Audio element play failed:", e));
    setTimeout(() => {
      audioElement.pause();
      audioElement.src = '';
    }, 500);
    console.log("Forced speaker mode via audio element.");
    return true;
  }

  return false;
}

// Create custom nonlinear reverb node
function createNonlinearReverbNode(context) {
  // Create nodes
  const input = context.createGain();
  const output = context.createGain();

  // FDN Reverb (simplified)
  const delay1 = context.createDelay(10);
  const delay2 = context.createDelay(10);
  const delay3 = context.createDelay(10);
  const delay4 = context.createDelay(10);
  delay1.delayTime.value = 0.1;
  delay2.delayTime.value = 0.15;
  delay3.delayTime.value = 0.2;
  delay4.delayTime.value = 0.25;

  // Feedback and diffusion
  const feedback1 = context.createGain();
  const feedback2 = context.createGain();
  const feedback3 = context.createGain();
  const feedback4 = context.createGain();
  feedback1.gain.value = 0.5;
  feedback2.gain.value = 0.5;
  feedback3.gain.value = 0.5;
  feedback4.gain.value = 0.5;

  // Diffusion
  const diffuser1 = context.createGain();
  const diffuser2 = context.createGain();
  const diffuser3 = context.createGain();
  const diffuser4 = context.createGain();
  diffuser1.gain.value = 0.7;
  diffuser2.gain.value = 0.7;
  diffuser3.gain.value = 0.7;
  diffuser4.gain.value = 0.7;

  // Modulation (LFO)
  const lfo = context.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 1;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 0.3;
  lfo.connect(lfoGain);

  // Nonlinearity (wavefolding)
  const waveShaper = context.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(0.2);

  // Tone control (HPF)
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  // Connect FDN reverb
  input.connect(delay1);
  input.connect(delay2);
  input.connect(delay3);
  input.connect(delay4);

  delay1.connect(diffuser1);
  delay2.connect(diffuser2);
  delay3.connect(diffuser3);
  delay4.connect(diffuser4);

  diffuser1.connect(feedback1);
  diffuser2.connect(feedback2);
  diffuser3.connect(feedback3);
  diffuser4.connect(feedback4);

  feedback1.connect(delay2);
  feedback1.connect(delay3);
  feedback2.connect(delay1);
  feedback2.connect(delay4);
  feedback3.connect(delay1);
  feedback3.connect(delay4);
  feedback4.connect(delay2);
  feedback4.connect(delay3);

  // Add modulation to delay times
  lfoGain.connect(delay1.delayTime);
  lfoGain.connect(delay2.delayTime);
  lfoGain.connect(delay3.delayTime);
  lfoGain.connect(delay4.delayTime);

  // Add nonlinearity
  feedback1.connect(waveShaper);
  feedback2.connect(waveShaper);
  feedback3.connect(waveShaper);
  feedback4.connect(waveShaper);

  // Apply tone control
  waveShaper.connect(filter);

  // Mix dry/wet
  input.connect(output);
  filter.connect(output);

  // Start LFO
  lfo.start();

  // Attach parameter setters to the output node
  output.setDecay = (value) => {
    delay1.delayTime.value = Math.min(value * 0.1, 10);
    delay2.delayTime.value = Math.min(value * 0.15, 10);
    delay3.delayTime.value = Math.min(value * 0.2, 10);
    delay4.delayTime.value = Math.min(value * 0.25, 10);
  };
  output.setDiffusion = (value) => {
    diffuser1.gain.value = value;
    diffuser2.gain.value = value;
    diffuser3.gain.value = value;
    diffuser4.gain.value = value;
  };
  output.setModDepth = (value) => {
    lfoGain.gain.value = value;
  };
  output.setModFreq = (value) => {
    lfo.frequency.value = value;
  };
  output.setTone = (value) => {
    filter.frequency.value = value;
  };
  output.setFeedback = (value) => {
    feedback1.gain.value = value;
    feedback2.gain.value = value;
    feedback3.gain.value = value;
    feedback4.gain.value = value;
  };
  output.setNonlinearity = (value) => {
    waveShaper.curve = makeDistortionCurve(value);
  };

  return output;
}

// Initialize audio context on user interaction
document.addEventListener('click', async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await forceMainSpeaker(audioContext); // Force main speaker
    await setupAudio();
  }
}, { once: true });

// Setup audio graph
async function setupAudio() {
  try {
    // Request mic access
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: null, // Use default mic
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    });
    micSource = audioContext.createMediaStreamSource(micStream);

    // Create reverb node (returns an AudioNode)
    reverbNode = createNonlinearReverbNode(audioContext);
    bypassNode = audioContext.createGain();

    // Connect nodes: mic -> reverb -> bypass -> output
    micSource.connect(reverbNode);
    reverbNode.connect(bypassNode);
    bypassNode.connect(audioContext.destination);

    // Set initial bypass state
    bypassNode.gain.value = 1;

    // Update status
    document.getElementById('status').textContent = 'Mic enabled. Audio routed to main speaker.';
    isProcessing = true;

    // Setup sliders
    setupSliders();

    // Setup presets
    setupPresets();
  } catch (err) {
    document.getElementById('status').textContent = 'Error: ' + err.message;
    console.error(err);
  }
}

// Setup sliders
function setupSliders() {
  const sliders = [
    { id: 'decay', param: 'setDecay', factor: 1 },
    { id: 'diffusion', param: 'setDiffusion', factor: 1 },
    { id: 'modDepth', param: 'setModDepth', factor: 1 },
    { id: 'modFreq', param: 'setModFreq', factor: 1 },
    { id: 'tone', param: 'setTone', factor: 1 },
    { id: 'feedback', param: 'setFeedback', factor: 1 },
    { id: 'nonlinearity', param: 'setNonlinearity', factor: 1 }
  ];

  sliders.forEach(({ id, param, factor }) => {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(`${id}Value`);
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value) * factor;
      valueDisplay.textContent = value.toFixed(value % 1 === 0 ? 0 : 2);
      if (reverbNode && !isBypassed) {
        reverbNode[param](value);
      }
    });
  });
}

// Setup presets
function setupPresets() {
  const presetButtons = document.querySelectorAll('.preset');
  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const presetName = button.dataset.preset;
      const preset = presets[presetName];
      if (!preset) return;

      // Update sliders and values
      document.getElementById('decay').value = preset.decay;
      document.getElementById('decayValue').textContent = preset.decay.toFixed(1);
      document.getElementById('diffusion').value = preset.diffusion;
      document.getElementById('diffusionValue').textContent = preset.diffusion.toFixed(2);
      document.getElementById('modDepth').value = preset.modDepth;
      document.getElementById('modDepthValue').textContent = preset.modDepth.toFixed(2);
      document.getElementById('modFreq').value = preset.modFreq;
      document.getElementById('modFreqValue').textContent = preset.modFreq.toFixed(1);
      document.getElementById('tone').value = preset.tone;
      document.getElementById('toneValue').textContent = preset.tone;
      document.getElementById('feedback').value = preset.feedback;
      document.getElementById('feedbackValue').textContent = preset.feedback.toFixed(2);
      document.getElementById('nonlinearity').value = preset.nonlinearity;
      document.getElementById('nonlinearityValue').textContent = preset.nonlinearity.toFixed(2);

      // Apply preset to reverb
      if (reverbNode && !isBypassed) {
        reverbNode.setDecay(preset.decay);
        reverbNode.setDiffusion(preset.diffusion);
        reverbNode.setModDepth(preset.modDepth);
        reverbNode.setModFreq(preset.modFreq);
        reverbNode.setTone(preset.tone);
        reverbNode.setFeedback(preset.feedback);
        reverbNode.setNonlinearity(preset.nonlinearity);
      }

      // Highlight active preset
      presetButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
}

// Bypass toggle
document.getElementById('bypassBtn').addEventListener('click', () => {
  isBypassed = !isBypassed;
  if (isBypassed) {
    bypassNode.gain.value = 0;
    document.getElementById('bypassBtn').textContent = 'Enable Reverb';
    document.getElementById('status').textContent = 'Reverb bypassed.';
  } else {
    bypassNode.gain.value = 1;
    document.getElementById('bypassBtn').textContent = 'Bypass Reverb';
    document.getElementById('status').textContent = 'Reverb enabled.';
  }
});
