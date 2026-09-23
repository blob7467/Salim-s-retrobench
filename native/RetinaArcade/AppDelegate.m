//
//  AppDelegate.m
//  RetinaArcade
//
//  iPhone 4 iOS 6.1 Native Arcade
//

#import "AppDelegate.h"
#import "ArcadeViewController.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    
    // Configure iOS 6 status bar appearance
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleBlackTranslucent];
    
    self.viewController = [[ArcadeViewController alloc] init];
    self.window.rootViewController = self.viewController;
    [self.window makeKeyAndVisible];
    
    return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application {
    // Pause games when interrupted by call or notification
    [self.viewController pauseCurrentGame];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Save high scores to NSUserDefaults
    [self.viewController saveGameState];
}

@end
