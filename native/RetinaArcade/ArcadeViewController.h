//
//  ArcadeViewController.h
//  RetinaArcade
//
//  Main Springboard & Game Orchestrator for iPhone 4 iOS 6
//

#import <UIKit/UIKit.h>
#import "BladeFruitView.h"
#import "DoodleLeapView.h"
#import "LabyrinthView.h"

@interface ArcadeViewController : UIViewController <BladeFruitDelegate, DoodleLeapDelegate, LabyrinthDelegate>

- (void)pauseCurrentGame;
- (void)saveGameState;

@end
