# AuraNonlinearReverb

### 🎛️ Nonlinear Reverb WASM SPA

[![GitHub stars](https://img.shields.io/github/stars/your-username/nonlinear-reverb-wasm.svg?style=social)](https://github.com/your-username/nonlinear-reverb-wasm/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-username/nonlinear-reverb-wasm.svg?style=social)](https://github.com/your-username/nonlinear-reverb-wasm/network)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![WASM](https://img.shields.io/badge/WASM-Ready-brightgreen)](https://webassembly.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Supported-ff69b4)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 📌 **Overview**
A **real-time, WASM-powered Single Page Application (SPA)** that applies **Nonlinear Reverb** to live microphone input. This project leverages the **Web Audio API** and **WebAssembly (WASM)** to deliver **high-performance, low-latency audio processing** directly in the browser.

**Key Features:**
✅ **Real-time audio processing** with live mic input.
✅ **Nonlinear Reverb** with **harmonic distortion**, **modulation**, and **feedback delay networks (FDN)**.
✅ **WASM-ready** for high-performance audio algorithms (Rust/C++ backend).
✅ **Customizable parameters** (decay, diffusion, modulation, tone, feedback, nonlinearity).
✅ **Presets** for quick experimentation (Shimmer, Chaotic, Infinite, Subtle, Dronescape).
✅ **Bypass toggle** for A/B testing.
✅ **Responsive UI** with intuitive controls.

**Impact on Sound:**
> Adds **harmonics + reverb modulation**, creating **shimmering, infinite, or chaotic textures** (inspired by **Valhalla Shimmer**).

---

---

## 🚀 **Demo**
![Nonlinear Reverb SPA Screenshot](https://via.placeholder.com/800x450/121212/00bcd4?text=Nonlinear+Reverb+SPA)
*(Replace with an actual screenshot of your app.)*

🔗 **[Live Demo](https://your-username.github.io/nonlinear-reverb-wasm/)** *(Deploy via GitHub Pages)*

---

---

## 🛠️ **Technical Stack**
| **Component**       | **Technology**                          |
|----------------------|----------------------------------------|
| **Frontend**         | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Audio Processing** | Web Audio API                          |
| **Performance**      | WebAssembly (WASM)                     |
| **WASM Backend**     | Rust (or C/C++)                        |
| **Build Tools**      | `wasm-pack`, `wasm-bindgen`             |
| **Deployment**       | GitHub Pages, Netlify, Vercel           |

---

---

## 📥 **Installation & Setup**

### **Option 1: Run Locally (JavaScript-Only Version)**
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/nonlinear-reverb-wasm.git
   cd nonlinear-reverb-wasm
   ```
2. **Open `index.html` in a browser:**
   - Use **Chrome** or **Firefox** (recommended for Web Audio API support).
   - Allow microphone access when prompted.

### **Option 2: Build with WASM (Rust Backend)**
1. **Install Rust and WASM toolchain:**
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   cargo install wasm-pack
   ```
2. **Build the WASM module:**
   ```sh
   cd wasm-reverb
   wasm-pack build --target web
   ```
3. **Serve the app locally:**
   ```sh
   cd ..
   python3 -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser.

---

---

## 🎚️ **Usage**
### **Controls**
| **Parameter**      | **Description**                                                                 | **Range**               |
|--------------------|---------------------------------------------------------------------------------|-------------------------|
| **Decay**          | Length of the reverb tail (seconds).                                            | `0.1s – 10s`            |
| **Diffusion**      | Density of reflections (higher = more dense).                                  | `0.0 – 1.0`             |
| **Mod Depth**      | Depth of LFO modulation applied to delay times.                                | `0.0 – 1.0`             |
| **Mod Freq**       | Frequency of LFO modulation (Hz).                                              | `0.1Hz – 10Hz`          |
| **Tone (HPF)**     | High-pass filter cutoff frequency.                                             | `20Hz – 20kHz`          |
| **Feedback**       | Amount of signal fed back into the reverb.                                     | `0.0 – 0.99`            |
| **Nonlinearity**   | Amount of wavefolding distortion (adds harmonics).                             | `0.0 – 1.0`             |

### **Presets**
| **Preset**      | **Description**                                                                 |
|-----------------|---------------------------------------------------------------------------------|
| **Shimmer**     | Bright, long decay with high modulation depth. Ideal for ethereal textures.     |
| **Chaotic**     | Short decay, high diffusion, and heavy nonlinearity for glitchy effects.       |
| **Infinite**    | Long decay with subtle modulation. Creates a "never-ending" reverb tail.        |
| **Subtle**      | Gentle reverb with low modulation and nonlinearity.                           |
| **Dronescape**  | Long, evolving reverb with deep modulation. Perfect for ambient soundscapes.   |

### **Bypass Mode**
- Toggle the **"Bypass Reverb"** button to **enable/disable** the effect for A/B testing.

---

---

## 🔧 **WASM Integration Guide**
To replace the JavaScript-based reverb with a **high-performance WASM module**:

### **1. Rust Implementation (Example)**
Create a new Rust library:
```sh
cargo new --lib wasm-reverb
cd wasm-reverb
```

Edit `Cargo.toml`:
```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

Edit `src/lib.rs`:
```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct NonlinearReverb {
    sample_rate: f32,
    decay: f32,
    diffusion: f32,
    mod_depth: f32,
    mod_freq: f32,
    // ... other parameters
}

#[wasm_bindgen]
impl NonlinearReverb {
    pub fn new(sample_rate: f32) -> Self {
        NonlinearReverb {
            sample_rate,
            decay: 3.0,
            diffusion: 0.7,
            mod_depth: 0.3,
            mod_freq: 1.0,
        }
    }

    pub fn process(&mut self, input: &[f32], output: &mut [f32]) {
        // Implement FDN + nonlinear processing here
        for i in 0..input.len() {
            output[i] = input[i] * self.decay; // Placeholder: Replace with actual reverb logic
        }
    }

    pub fn set_decay(&mut self, decay: f32) {
        self.decay = decay;
    }
    // ... other setters
}
```

### **2. Compile to WASM**
```sh
wasm-pack build --target web
```

### **3. Load WASM in JavaScript**
Update `index.html`:
```html
<script type="module">
  import init, { NonlinearReverb } from './wasm-reverb/pkg/nonlinear_reverb.js';
  await init();
  const reverb = NonlinearReverb.new(audioContext.sampleRate);
</script>
```

### **4. Replace `createNonlinearReverbNode`**
Use an **`AudioWorklet`** to process audio with WASM:
```javascript
class NonlinearReverbWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.reverb = new NonlinearReverb(audioContext.sampleRate);
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    this.reverb.process(input, output);
    return true;
  }
}

registerProcessor('nonlinear-reverb', NonlinearReverbWorklet);
```

---

---

## 🤝 **Contributing**
Contributions are welcome! Here’s how you can help:
1. **Fork the repository** and create a new branch.
2. **Commit your changes** with clear, descriptive messages.
3. **Submit a Pull Request** for review.

### **Development Workflow**
- **Test locally** before submitting changes.
- **Follow Rust/WASM best practices** for performance-critical code.
- **Update the README** if you add new features or presets.

---

---

## 📜 **License**
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

---

## 🙏 **Acknowledgments**
- **Web Audio API** – [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **WASM** – [WebAssembly](https://webassembly.org/)
- **Rust and WASM** – [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- **Inspiration**: Valhalla DSP ([Valhalla Shimmer](https://valhalladsp.com/))

