//
//  BladeFruitView.h
//  RetinaArcade
//
//  Native Fruit Slicing Game with CoreGraphics & CADisplayLink
//

#import <UIKit/UIKit.h>

@protocol BladeFruitDelegate <NSObject>
- (void)bladeFruitDidFinishWithScore:(NSInteger)score;
- (void)bladeFruitDidUnlockAchievement:(NSString *)title points:(NSInteger)points;
@end

@interface BladeFruitView : UIView

@property (nonatomic, weak) id<BladeFruitDelegate> delegate;

- (void)startGame;
- (void)pauseGame;
- (void)resumeGame;
- (void)resetGame;

@end
