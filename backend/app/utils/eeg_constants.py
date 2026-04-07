# EEG Spectral Band Definitions (Hz)
# Standardized values for clinical EEG analysis
EEG_BANDS = {
    'delta': (0.5, 4),
    'theta': (4, 8),
    'alpha': (8, 13),
    'beta': (13, 30),
    'gamma': (30, 45)
}

# Feature Extraction Settings
DEFAULT_FMIN = 0.5
DEFAULT_FMAX = 45
PSD_METHOD = 'welch'
