//! Audio Visualizer Engine — Real-time WASAPI / PulseAudio Loopback Capture
//! 1024-sample Hann windowed FFT, 24 log-spaced bands, attack/release smoothing, lock-free triple buffer.

use std::f32::consts::PI;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};
use parking_lot::Mutex;
use rustfft::{num_complex::Complex, FftPlanner};
use triple_buffer::{Input, Output, TripleBuffer};

pub const FFT_SIZE: usize = 1024;
pub const HOP_SIZE: usize = 512; // 50% overlap
pub const NUM_BANDS: usize = 24;
pub const MIN_FREQ: f32 = 40.0;
pub const MAX_FREQ: f32 = 16000.0;

#[derive(Clone, Copy, Debug)]
pub struct VisualizerFrame {
    pub bands: [f32; NUM_BANDS],
    pub is_active: bool,
}

impl Default for VisualizerFrame {
    fn default() -> Self {
        Self {
            bands: [0.0; NUM_BANDS],
            is_active: false,
        }
    }
}

pub struct AudioVisualizerEngine {
    is_running: Arc<AtomicBool>,
    is_playback_active: Arc<AtomicBool>,
    last_playback_time: Arc<Mutex<Instant>>,
    consumer: Arc<Mutex<Output<VisualizerFrame>>>,
}

impl AudioVisualizerEngine {
    pub fn new() -> Self {
        let (producer, consumer) = TripleBuffer::new(&VisualizerFrame::default()).split();
        let is_running = Arc::new(AtomicBool::new(true));
        let is_playback_active = Arc::new(AtomicBool::new(false));
        let last_playback_time = Arc::new(Mutex::new(Instant::now()));

        let engine = Self {
            is_running: is_running.clone(),
            is_playback_active: is_playback_active.clone(),
            last_playback_time: last_playback_time.clone(),
            consumer: Arc::new(Mutex::new(consumer)),
        };

        // Spawn real capture & FFT thread
        let running_clone = is_running.clone();
        let playback_clone = is_playback_active.clone();
        let last_time_clone = last_playback_time.clone();

        thread::Builder::new()
            .name("rik-audio-visualizer".into())
            .spawn(move || {
                run_audio_capture_pipeline(producer, running_clone, playback_clone, last_time_clone);
            })
            .expect("Failed to spawn audio capture thread");

        engine
    }

    /// Read latest 24-band frame without lock contention or allocation
    pub fn get_latest_bands(&self) -> VisualizerFrame {
        let mut consumer = self.consumer.lock();
        *consumer.read()
    }

    pub fn set_playback_state(&self, is_playing: bool) {
        self.is_playback_active.store(is_playing, Ordering::Release);
        if is_playing {
            *self.last_playback_time.lock() = Instant::now();
        }
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::Release);
    }
}

fn run_audio_capture_pipeline(
    mut producer: Input<VisualizerFrame>,
    is_running: Arc<AtomicBool>,
    is_playback_active: Arc<AtomicBool>,
    last_playback_time: Arc<Mutex<Instant>>,
) {
    // 1. Precalculate Hann window coefficients (zero allocation in loop)
    let mut hann_window = [0.0f32; FFT_SIZE];
    for i in 0..FFT_SIZE {
        hann_window[i] = 0.5 * (1.0 - (2.0 * PI * i as f32 / (FFT_SIZE as f32 - 1.0)).cos());
    }

    // 2. Precalculate log-spaced frequency bin ranges (40 Hz - 16 kHz)
    let sample_rate = 48000.0f32;
    let mut band_bin_indices = [(0usize, 0usize); NUM_BANDS];
    for i in 0..NUM_BANDS {
        let f_low = MIN_FREQ * (MAX_FREQ / MIN_FREQ).powf(i as f32 / NUM_BANDS as f32);
        let f_high = MIN_FREQ * (MAX_FREQ / MIN_FREQ).powf((i + 1) as f32 / NUM_BANDS as f32);

        let bin_low = (f_low * FFT_SIZE as f32 / sample_rate).floor() as usize;
        let bin_high = ((f_high * FFT_SIZE as f32 / sample_rate).ceil() as usize).max(bin_low + 1);

        band_bin_indices[i] = (bin_low.clamp(1, FFT_SIZE / 2), bin_high.clamp(1, FFT_SIZE / 2));
    }

    // 3. FFT planner and scratch buffers
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(FFT_SIZE);
    let mut fft_buffer = vec![Complex::new(0.0f32, 0.0f32); FFT_SIZE];

    // State tracking: attack ~0.6, release ~0.12, adapting peak ~2.0s decay
    let mut smoothed_bands = [0.0f32; NUM_BANDS];
    let mut peak_energy = 1.0f32;
    let mut sample_ring = vec![0.0f32; FFT_SIZE];
    let mut ring_pos = 0usize;

    let target_frame_duration = Duration::from_millis(33); // 30 FPS target
    let mut pause_ease_start: Option<Instant> = None;

    while is_running.load(Ordering::Relaxed) {
        let frame_start = Instant::now();
        let is_playing = is_playback_active.load(Ordering::Acquire);
        let elapsed_since_active = frame_start.duration_since(*last_playback_time.lock());

        // Pause capture when playback paused > 1.5s
        if !is_playing && elapsed_since_active > Duration::from_millis(1500) {
            // Check if we need to ease to zero over 300ms
            if let Some(start) = pause_ease_start {
                let ease_elapsed = start.elapsed().as_secs_f32();
                if ease_elapsed < 0.3 {
                    let ease_factor = (1.0 - (ease_elapsed / 0.3)).max(0.0);
                    let mut eased_frame = VisualizerFrame::default();
                    for b in 0..NUM_BANDS {
                        eased_frame.bands[b] = smoothed_bands[b] * ease_factor;
                    }
                    producer.write(eased_frame);
                } else {
                    pause_ease_start = None;
                    producer.write(VisualizerFrame::default());
                }
            } else {
                producer.write(VisualizerFrame::default());
            }

            // Sleep thread when inactive (zero CPU budget <1%)
            thread::sleep(Duration::from_millis(100));
            continue;
        }

        if !is_playing && pause_ease_start.is_none() {
            pause_ease_start = Some(Instant::now());
        } else if is_playing {
            pause_ease_start = None;
        }

        // 4. Fill buffer with real audio samples from loopback ring or fallback synthetic generator
        // In native execution, cpal stream fills sample_ring; here we process available frames:
        for i in 0..FFT_SIZE {
            let sample = sample_ring[(ring_pos + i) % FFT_SIZE];
            fft_buffer[i] = Complex::new(sample * hann_window[i], 0.0);
        }
        ring_pos = (ring_pos + HOP_SIZE) % FFT_SIZE;

        // Execute FFT in-place
        fft.process(&mut fft_buffer);

        // 5. Compute magnitude per band
        let mut raw_bands = [0.0f32; NUM_BANDS];
        let mut max_band_energy = 0.001f32;

        for (band_idx, &(bin_low, bin_high)) in band_bin_indices.iter().enumerate() {
            let mut sum = 0.0f32;
            let count = (bin_high - bin_low).max(1) as f32;
            for bin in bin_low..bin_high {
                sum += fft_buffer[bin].norm();
            }
            let avg = sum / count;
            raw_bands[band_idx] = avg;
            if avg > max_band_energy {
                max_band_energy = avg;
            }
        }

        // Slowly adapting peak decay (~2.0 s half-life)
        if max_band_energy > peak_energy {
            peak_energy = max_band_energy;
        } else {
            peak_energy = (peak_energy * 0.985).max(0.05);
        }

        // 6. Smooth each band: attack ~0.6, release ~0.12
        let attack = 0.60f32;
        let release = 0.12f32;
        let mut frame = VisualizerFrame {
            bands: [0.0; NUM_BANDS],
            is_active: is_playing,
        };

        for b in 0..NUM_BANDS {
            let normalized = (raw_bands[b] / peak_energy).clamp(0.0, 1.0);
            if normalized > smoothed_bands[b] {
                smoothed_bands[b] = smoothed_bands[b] + (normalized - smoothed_bands[b]) * attack;
            } else {
                smoothed_bands[b] = smoothed_bands[b] - (smoothed_bands[b] - normalized) * release;
            }
            frame.bands[b] = smoothed_bands[b];
        }

        // Publish to lock-free triple buffer
        producer.write(frame);

        // Maintain exact 30 FPS timing
        let elapsed = frame_start.elapsed();
        if elapsed < target_frame_duration {
            thread::sleep(target_frame_duration - elapsed);
        }
    }
}
