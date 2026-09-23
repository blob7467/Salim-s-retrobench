//
//  LabyrinthView.h
//  RetinaArcade
//
//  Native 3D Marble Tilt Labyrinth using 3-Axis Gyroscope
//

#import <UIKit/UIKit.h>
#import <CoreMotion/CoreMotion.h>

@protocol LabyrinthDelegate <NSObject>
- (void)labyrinthDidFinishLevel:(NSInteger)level time:(NSTimeInterval)time;
- (void)labyrinthDidUnlockAchievement:(NSString *)title points:(NSInteger)points;
@end

@interface LabyrinthView : UIView

@property (nonatomic, weak) id<LabyrinthDelegate> delegate;

- (void)startGame;
- (void)pauseGame;
- (void)resumeGame;
- (void)resetGame;

@end
