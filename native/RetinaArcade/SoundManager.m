//
//  SoundManager.m
//  RetinaArcade
//

#import "SoundManager.h"

@interface SoundManager () {
    SystemSoundID _sliceSound;
    SystemSoundID _bounceSound;
    SystemSoundID _ballRollSound;
    SystemSoundID _bombSound;
    SystemSoundID _clickSound;
}
@end

@implementation SoundManager

+ (instancetype)sharedManager {
    static SoundManager *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[SoundManager alloc] init];
    });
    return instance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _soundEnabled = YES;
        [self loadSounds];
    }
    return self;
}

- (void)loadSounds {
    // iOS 6 System sound effects or local audio files
    _clickSound = 1104; // Tock sound ID
}

- (void)playSliceSound {
    if (!_soundEnabled) return;
    AudioServicesPlaySystemSound(1057); // Fast whoosh
}

- (void)playBounceSound {
    if (!_soundEnabled) return;
    AudioServicesPlaySystemSound(1054);
}

- (void)playBallRollSound {
    if (!_soundEnabled) return;
    // CoreAudio low frequency rumble
}

- (void)playBombExplodeSound {
    if (!_soundEnabled) return;
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

- (void)playClickSound {
    if (!_soundEnabled) return;
    AudioServicesPlaySystemSound(1104);
}

- (void)playUnlockAchievementSound {
    if (!_soundEnabled) return;
    AudioServicesPlaySystemSound(1025); // Chime
}

@end
