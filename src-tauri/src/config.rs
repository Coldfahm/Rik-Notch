//! Configuration system supporting TOML serialization and runtime reloading.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotchConfig {
    pub visualiser: bool,
    pub bands: usize,
    pub hover_delay_ms: u64,
    pub collapse_delay_ms: u64,
    pub peek_duration_ms: u64,
    pub peek_enabled: bool,
    pub default_page: usize,
    pub monitor: String, // "primary" or "cursor"
}

impl Default for NotchConfig {
    fn default() -> Self {
        Self {
            visualiser: true,
            bands: 24,
            hover_delay_ms: 120,
            collapse_delay_ms: 300,
            peek_duration_ms: 2500,
            peek_enabled: true,
            default_page: 0,
            monitor: "primary".to_string(),
        }
    }
}

impl NotchConfig {
    pub fn load_or_default<P: AsRef<Path>>(path: P) -> Self {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(config) = toml::from_str(&content) {
                return config;
            }
        }
        let default_config = Self::default();
        if let Ok(serialized) = toml::to_string_pretty(&default_config) {
            let _ = fs::write(path, serialized);
        }
        default_config
    }
}
