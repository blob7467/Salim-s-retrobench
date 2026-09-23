//
//  SoundManager.h
//  RetinaArcade
//

#import <Foundation/Foundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVFoundation.h>

@interface SoundManager : NSObject

+ (instancetype)sharedManager;

- (void)playSliceSound;
- (void)playBounceSound;
- (void)playBallRollSound;
- (void)playBombExplodeSound;
- (void)playClickSound;
- (void)playUnlockAchievementSound;

@property (nonatomic, assign) BOOL soundEnabled;

@end
