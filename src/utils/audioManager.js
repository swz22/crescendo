// Centralized audio management
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
    this.audioElement = null;
    this.volume = 0.3; // Default volume
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
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

  async setAudioElement(audioElement) {
    if (!audioElement) return;

    // Clean up previous audio element
    if (this.audioElement && this.audioElement !== audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement.load();
    }

    this.audioElement = audioElement;

    // Set initial volume
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }

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
      // This error is expected if audio element is already connected
      if (!error.message.includes("already been used")) {
        console.error("Failed to connect audio element:", error);
      }
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));

    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }

    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        this.volume,
        this.audioContext.currentTime
      );
    }
  }

  getVolume() {
    return this.volume;
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
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
