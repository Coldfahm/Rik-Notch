//! Hover State Machine & Auto-Peek Transition Logic
//! Explicit enum-based state machine with comprehensive unit tests for all interaction invariants.

use std::time::{Duration, Instant};

pub const HOVER_INTENT_DELAY: Duration = Duration::from_millis(120);
pub const COLLAPSE_DELAY: Duration = Duration::from_millis(300);
pub const PEEK_DURATION: Duration = Duration::from_millis(2500);
pub const STICKY_PAGE_DURATION: Duration = Duration::from_secs(8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NotchState {
    Collapsed,
    Peeking { expires_at: Instant },
    Expanded { entered_at: Instant },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlaybackState {
    Playing,
    Paused,
    Stopped,
}

pub struct HoverStateMachine {
    pub state: NotchState,
    pub active_page: usize,
    pub last_used_page: usize,
    pub default_page: usize,
    pub is_cursor_over: bool,
    pub hover_entered_at: Option<Instant>,
    pub leave_entered_at: Option<Instant>,
    pub manual_switch_at: Option<Instant>,
    pub is_first_track: bool,
}

impl HoverStateMachine {
    pub fn new(default_page: usize) -> Self {
        Self {
            state: NotchState::Collapsed,
            active_page: default_page,
            last_used_page: default_page,
            default_page,
            is_cursor_over: false,
            hover_entered_at: None,
            leave_entered_at: None,
            manual_switch_at: None,
            is_first_track: true, // Don't peek on app start
        }
    }

    /// Cursor entered the notch bounding box
    pub fn on_cursor_enter(&mut self, now: Instant) {
        self.is_cursor_over = true;
        self.leave_entered_at = None;

        match self.state {
            NotchState::Collapsed => {
                if self.hover_entered_at.is_none() {
                    self.hover_entered_at = Some(now);
                }
            }
            NotchState::Peeking { .. } => {
                // Upgraded from peek to full expansion
                self.state = NotchState::Expanded { entered_at: now };
                self.hover_entered_at = None;
            }
            NotchState::Expanded { .. } => {
                // Re-entered before collapse grace period expired
            }
        }
    }

    /// Cursor left the notch bounding box
    pub fn on_cursor_leave(&mut self, now: Instant) {
        self.is_cursor_over = false;
        self.hover_entered_at = None;

        if let NotchState::Expanded { .. } = self.state {
            self.leave_entered_at = Some(now);
        }
    }

    /// External event: Track started or changed
    pub fn on_track_change(&mut self, now: Instant, playback: PlaybackState) {
        if self.is_first_track {
            self.is_first_track = false;
            return; // Invariant: Do not peek on app start
        }

        if playback != PlaybackState::Playing {
            return; // Invariant: Do not peek on pause
        }

        match self.state {
            NotchState::Collapsed => {
                // Auto-peek: expand to Media page (page 0) for 2.5s
                self.state = NotchState::Peeking {
                    expires_at: now + PEEK_DURATION,
                };
                self.active_page = 0; // Media page
            }
            NotchState::Expanded { .. } => {
                // Invariant: If notch is already open on another page, do NOT switch pages
            }
            NotchState::Peeking { .. } => {
                // Extend peek duration
                self.state = NotchState::Peeking {
                    expires_at: now + PEEK_DURATION,
                };
            }
        }
    }

    /// User manually scrolled or clicked page dots
    pub fn on_manual_page_switch(&mut self, new_page: usize, now: Instant) {
        self.active_page = new_page;
        self.last_used_page = new_page;
        self.manual_switch_at = Some(now);
    }

    /// Periodic tick (called every frame or timer event)
    pub fn update(&mut self, now: Instant, playback: PlaybackState) {
        // 1. Check hover intent timer (120ms threshold)
        if self.is_cursor_over {
            if let Some(hover_start) = self.hover_entered_at {
                if now.duration_since(hover_start) >= HOVER_INTENT_DELAY {
                    self.hover_entered_at = None;
                    self.state = NotchState::Expanded { entered_at: now };

                    // Invariant: On expand, if playing show Media (0), otherwise last_used or default
                    if let Some(manual_time) = self.manual_switch_at {
                        if now.duration_since(manual_time) < STICKY_PAGE_DURATION {
                            // Sticky choice active, keep active_page
                            return;
                        }
                    }

                    if playback == PlaybackState::Playing {
                        self.active_page = 0; // Media page
                    } else {
                        self.active_page = self.last_used_page;
                    }
                }
            }
        }

        // 2. Check collapse exit timer (300ms delay)
        if !self.is_cursor_over {
            if let Some(leave_start) = self.leave_entered_at {
                if now.duration_since(leave_start) >= COLLAPSE_DELAY {
                    self.leave_entered_at = None;
                    self.state = NotchState::Collapsed;
                    self.manual_switch_at = None;
                }
            }
        }

        // 3. Check peek expiration (2.5s)
        if let NotchState::Peeking { expires_at } = self.state {
            if now >= expires_at {
                if !self.is_cursor_over {
                    self.state = NotchState::Collapsed;
                } else {
                    // Cursor is hovering, upgrade to full expansion
                    self.state = NotchState::Expanded { entered_at: now };
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hover_intent_120ms_expansion() {
        let mut sm = HoverStateMachine::new(1);
        let start = Instant::now();

        sm.on_cursor_enter(start);
        assert_eq!(sm.state, NotchState::Collapsed);

        // Advance 100ms: still collapsed (below 120ms threshold)
        sm.update(start + Duration::from_millis(100), PlaybackState::Stopped);
        assert_eq!(sm.state, NotchState::Collapsed);

        // Advance past 120ms: expanded!
        sm.update(start + Duration::from_millis(130), PlaybackState::Stopped);
        assert!(matches!(sm.state, NotchState::Expanded { .. }));
        assert_eq!(sm.active_page, 1); // Defaults to last_used/default
    }

    #[test]
    fn test_expand_shows_media_if_playing() {
        let mut sm = HoverStateMachine::new(2);
        let start = Instant::now();

        sm.on_cursor_enter(start);
        sm.update(start + Duration::from_millis(150), PlaybackState::Playing);

        assert!(matches!(sm.state, NotchState::Expanded { .. }));
        assert_eq!(sm.active_page, 0); // Media page priority
    }

    #[test]
    fn test_sticky_manual_switch_8_seconds() {
        let mut sm = HoverStateMachine::new(0);
        let start = Instant::now();

        sm.on_cursor_enter(start);
        sm.update(start + Duration::from_millis(150), PlaybackState::Playing);
        assert_eq!(sm.active_page, 0);

        // User manually switches to Focus (page 1)
        sm.on_manual_page_switch(1, start + Duration::from_millis(200));
        assert_eq!(sm.active_page, 1);

        // Within 8s of continued hover, page remains sticky on 1
        sm.update(start + Duration::from_millis(5000), PlaybackState::Playing);
        assert_eq!(sm.active_page, 1);
    }

    #[test]
    fn test_auto_peek_on_track_change_while_collapsed() {
        let mut sm = HoverStateMachine::new(2);
        let start = Instant::now();
        sm.is_first_track = false;

        // Track changes while collapsed
        sm.on_track_change(start, PlaybackState::Playing);
        assert!(matches!(sm.state, NotchState::Peeking { .. }));
        assert_eq!(sm.active_page, 0);

        // After 2.4s: still peeking
        sm.update(start + Duration::from_millis(2400), PlaybackState::Playing);
        assert!(matches!(sm.state, NotchState::Peeking { .. }));

        // After 2.6s: collapses back
        sm.update(start + Duration::from_millis(2600), PlaybackState::Playing);
        assert_eq!(sm.state, NotchState::Collapsed);
    }

    #[test]
    fn test_track_change_while_expanded_does_not_switch_page() {
        let mut sm = HoverStateMachine::new(3); // Start on Shelf page
        let start = Instant::now();
        sm.is_first_track = false;

        sm.on_cursor_enter(start);
        sm.update(start + Duration::from_millis(150), PlaybackState::Stopped);
        assert_eq!(sm.active_page, 3);

        // Track change occurs while open on Shelf (page 3)
        sm.on_track_change(start + Duration::from_millis(400), PlaybackState::Playing);
        // Invariant: Must remain on page 3!
        assert_eq!(sm.active_page, 3);
        assert!(matches!(sm.state, NotchState::Expanded { .. }));
    }

    #[test]
    fn test_no_peek_on_pause_or_app_start() {
        let mut sm = HoverStateMachine::new(0);
        let start = Instant::now();

        // 1. App start: is_first_track = true
        sm.on_track_change(start, PlaybackState::Playing);
        assert_eq!(sm.state, NotchState::Collapsed);

        // 2. Playback paused:
        sm.on_track_change(start + Duration::from_millis(500), PlaybackState::Paused);
        assert_eq!(sm.state, NotchState::Collapsed);
    }
}
