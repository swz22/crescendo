// Centralized audio management
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Create analyser for visualizations (future feature)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.gainNode);

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }
  }

  async connectAudioElement(audioElement) {
    if (!this.isInitialized) await this.initialize();
    if (!this.audioContext || !audioElement) return;

    try {
      // Check if already connected
      if (audioElement.audioSource) return;

      const source = this.audioContext.createMediaElementSource(audioElement);
      source.connect(this.analyser);

      // Store reference
      audioElement.audioSource = source;
    } catch (error) {
      console.error("Failed to connect audio element:", error);
    }
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
    }
  }

  // Get frequency data for visualizations
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  // Resume audio context (needed for autoplay)
  async resume() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  // Clean up resources
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

export const audioManager = new AudioManager();
