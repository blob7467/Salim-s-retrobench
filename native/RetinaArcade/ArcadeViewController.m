//
//  ArcadeViewController.m
//  RetinaArcade
//

#import "ArcadeViewController.h"
#import "SoundManager.h"

@interface ArcadeViewController () {
    UIView *_springboardContainer;
    UIView *_currentGameContainer;
    BladeFruitView *_fruitView;
    DoodleLeapView *_doodleView;
    LabyrinthView *_labyrinthView;
    
    NSInteger _highFruitScore;
    NSInteger _highDoodleScore;
    NSInteger _labyrinthStars;
}
@end

@implementation ArcadeViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    self.view.backgroundColor = [UIColor blackColor];
    
    [self loadSavedScores];
    [self setupSpringboardUI];
}

- (void)loadSavedScores {
    NSUserDefaults *defs = [NSUserDefaults standardUserDefaults];
    _highFruitScore = [defs integerForKey:@"highFruitScore"];
    _highDoodleScore = [defs integerForKey:@"highDoodleScore"];
    _labyrinthStars = [defs integerForKey:@"labyrinthStars"];
}

- (void)saveGameState {
    NSUserDefaults *defs = [NSUserDefaults standardUserDefaults];
    [defs setInteger:_highFruitScore forKey:@"highFruitScore"];
    [defs setInteger:_highDoodleScore forKey:@"highDoodleScore"];
    [defs setInteger:_labyrinthStars forKey:@"labyrinthStars"];
    [defs synchronize];
}

- (void)setupSpringboardUI {
    _springboardContainer = [[UIView alloc] initWithFrame:self.view.bounds];
    _springboardContainer.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _springboardContainer.backgroundColor = [UIColor colorWithRed:0.08 green:0.12 blue:0.18 alpha:1.0];
    [self.view addSubview:_springboardContainer];
    
    // Water droplets wallpaper simulated gradient
    CAGradientLayer *grad = [CAGradientLayer layer];
    grad.frame = self.view.bounds;
    grad.colors = @[
        (id)[UIColor colorWithRed:0.09 green:0.15 blue:0.20 alpha:1.0].CGColor,
        (id)[UIColor colorWithRed:0.04 green:0.06 blue:0.08 alpha:1.0].CGColor
    ];
    [_springboardContainer.layer insertSublayer:grad atIndex:0];
    
    // Header label: RETINA ARCADE · iOS 6
    UILabel *titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 36, self.view.bounds.size.width, 24)];
    titleLabel.text = @"RETINA ARCADE";
    titleLabel.textColor = [UIColor whiteColor];
    titleLabel.font = [UIFont boldSystemFontOfSize:16];
    titleLabel.textAlignment = NSTextAlignmentCenter;
    titleLabel.shadowColor = [UIColor colorWithWhite:0 alpha:0.8];
    titleLabel.shadowOffset = CGSizeMake(0, 1);
    [_springboardContainer addSubview:titleLabel];
    
    UILabel *subLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 58, self.view.bounds.size.width, 18)];
    subLabel.text = @"iPhone 4 (A1332) · iOS 6.1.6 Native";
    subLabel.textColor = [UIColor colorWithWhite:0.75 alpha:1.0];
    subLabel.font = [UIFont systemFontOfSize:11];
    subLabel.textAlignment = NSTextAlignmentCenter;
    [_springboardContainer addSubview:subLabel];
    
    // 3 Main App Launchers
    CGFloat startY = 100;
    NSArray *apps = @[
        @{@"title": @"Blade Fruit", @"sub": @"Slice juicy melons & combo cuts", @"tag": @1, @"icon": @"🍉"},
        @{@"title": @"Doodle Leap", @"sub": @"Jump high with hardware tilt", @"tag": @2, @"icon": @"🐸"},
        @{@"title": @"Labyrinth 3D", @"sub": @"3-Axis Gyroscope steel marble", @"tag": @3, @"icon": @"🎱"}
    ];
    
    for (NSDictionary *app in apps) {
        UIButton *btn = [UIButton buttonWithType:UIButtonTypeCustom];
        btn.frame = CGRectMake(24, startY, self.view.bounds.size.width - 48, 64);
        btn.backgroundColor = [UIColor colorWithWhite:0.15 alpha:0.85];
        btn.layer.cornerRadius = 14;
        btn.layer.borderColor = [UIColor colorWithWhite:0.3 alpha:0.6].CGColor;
        btn.layer.borderWidth = 1;
        btn.tag = [app[@"tag"] integerValue];
        [btn addTarget:self action:@selector(launchAppClicked:) forControlEvents:UIControlEventTouchUpInside];
        
        // Icon label
        UILabel *ic = [[UILabel alloc] initWithFrame:CGRectMake(14, 12, 40, 40)];
        ic.text = app[@"icon"];
        ic.font = [UIFont systemFontOfSize:28];
        [btn addSubview:ic];
        
        // Title
        UILabel *t = [[UILabel alloc] initWithFrame:CGRectMake(62, 12, 180, 20)];
        t.text = app[@"title"];
        t.textColor = [UIColor whiteColor];
        t.font = [UIFont boldSystemFontOfSize:15];
        [btn addSubview:t];
        
        // Subtitle
        UILabel *s = [[UILabel alloc] initWithFrame:CGRectMake(62, 34, 200, 16)];
        s.text = app[@"sub"];
        s.textColor = [UIColor colorWithWhite:0.65 alpha:1.0];
        s.font = [UIFont systemFontOfSize:11];
        [btn addSubview:s];
        
        [_springboardContainer addSubview:btn];
        startY += 78;
    }
    
    // Bottom Dock (Gloss glass shelf)
    UIView *dock = [[UIView alloc] initWithFrame:CGRectMake(0, self.view.bounds.size.height - 80, self.view.bounds.size.width, 80)];
    dock.backgroundColor = [UIColor colorWithWhite:0 alpha:0.4];
    dock.layer.borderColor = [UIColor colorWithWhite:1 alpha:0.2].CGColor;
    dock.layer.borderWidth = 0.5;
    [_springboardContainer addSubview:dock];
    
    UILabel *dockNote = [[UILabel alloc] initWithFrame:dock.bounds];
    dockNote.text = @"Tap any game to launch native ARMv7 engine";
    dockNote.textColor = [UIColor colorWithWhite:0.7 alpha:1.0];
    dockNote.font = [UIFont systemFontOfSize:12];
    dockNote.textAlignment = NSTextAlignmentCenter;
    [dock addSubview:dockNote];
}

- (void)launchAppClicked:(UIButton *)sender {
    [[SoundManager sharedManager] playClickSound];
    
    _currentGameContainer = [[UIView alloc] initWithFrame:self.view.bounds];
    _currentGameContainer.backgroundColor = [UIColor blackColor];
    
    // Top Bar with Back Button
    UIView *navBar = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.view.bounds.size.width, 44)];
    navBar.backgroundColor = [UIColor colorWithRed:0.2 green:0.22 blue:0.26 alpha:0.95];
    
    UIButton *backBtn = [UIButton buttonWithType:UIButtonTypeCustom];
    backBtn.frame = CGRectMake(8, 6, 70, 32);
    [backBtn setTitle:@"◀ Home" forState:UIControlStateNormal];
    backBtn.titleLabel.font = [UIFont boldSystemFontOfSize:12];
    [backBtn setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    backBtn.backgroundColor = [UIColor colorWithWhite:0.25 alpha:0.8];
    backBtn.layer.cornerRadius = 6;
    [backBtn addTarget:self action:@selector(exitGame) forControlEvents:UIControlEventTouchUpInside];
    [navBar addSubview:backBtn];
    
    CGRect gameFrame = CGRectMake(0, 44, self.view.bounds.size.width, self.view.bounds.size.height - 44);
    
    if (sender.tag == 1) {
        _fruitView = [[BladeFruitView alloc] initWithFrame:gameFrame];
        _fruitView.delegate = self;
        [_currentGameContainer addSubview:_fruitView];
    } else if (sender.tag == 2) {
        _doodleView = [[DoodleLeapView alloc] initWithFrame:gameFrame];
        _doodleView.delegate = self;
        [_currentGameContainer addSubview:_doodleView];
    } else if (sender.tag == 3) {
        _labyrinthView = [[LabyrinthView alloc] initWithFrame:gameFrame];
        _labyrinthView.delegate = self;
        [_currentGameContainer addSubview:_labyrinthView];
    }
    
    [_currentGameContainer addSubview:navBar];
    [self.view addSubview:_currentGameContainer];
}

- (void)exitGame {
    [[SoundManager sharedManager] playClickSound];
    [self pauseCurrentGame];
    [_currentGameContainer removeFromSuperview];
    _currentGameContainer = nil;
    _fruitView = nil;
    _doodleView = nil;
    _labyrinthView = nil;
}

- (void)pauseCurrentGame {
    [_fruitView pauseGame];
    [_doodleView pauseGame];
    [_labyrinthView pauseGame];
}

#pragma mark - Delegates

- (void)bladeFruitDidFinishWithScore:(NSInteger)score {
    if (score > _highFruitScore) {
        _highFruitScore = score;
        [self saveGameState];
    }
}

- (void)bladeFruitDidUnlockAchievement:(NSString *)title points:(NSInteger)points {
    [[SoundManager sharedManager] playUnlockAchievementSound];
}

- (void)doodleLeapDidFinishWithScore:(NSInteger)score {
    if (score > _highDoodleScore) {
        _highDoodleScore = score;
        [self saveGameState];
    }
}

- (void)doodleLeapDidUnlockAchievement:(NSString *)title points:(NSInteger)points {
    [[SoundManager sharedManager] playUnlockAchievementSound];
}

- (void)labyrinthDidFinishLevel:(NSInteger)level time:(NSTimeInterval)time {
    _labyrinthStars += 3;
    [self saveGameState];
}

- (void)labyrinthDidUnlockAchievement:(NSString *)title points:(NSInteger)points {
    [[SoundManager sharedManager] playUnlockAchievementSound];
}

@end
