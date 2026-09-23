//
//  DoodleLeapView.h
//  RetinaArcade
//
//  Native Tilt Jump Game using CoreMotion (Accelerometer)
//

#import <UIKit/UIKit.h>
#import <CoreMotion/CoreMotion.h>

@protocol DoodleLeapDelegate <NSObject>
- (void)doodleLeapDidFinishWithScore:(NSInteger)score;
- (void)doodleLeapDidUnlockAchievement:(NSString *)title points:(NSInteger)points;
@end

@interface DoodleLeapView : UIView

@property (nonatomic, weak) id<DoodleLeapDelegate> delegate;

- (void)startGame;
- (void)pauseGame;
- (void)resumeGame;
- (void)resetGame;

@end
