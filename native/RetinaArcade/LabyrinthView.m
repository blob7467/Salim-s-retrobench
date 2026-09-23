//
//  LabyrinthView.m
//  RetinaArcade
//

#import "LabyrinthView.h"
#import "SoundManager.h"
#import <QuartzCore/QuartzCore.h>

@interface LabyrinthView () {
    CADisplayLink *_displayLink;
    CMMotionManager *_motionManager;
    CGPoint _ballPos;
    CGPoint _ballVel;
    NSMutableArray *_walls;
    NSMutableArray *_holes;
    CGPoint _goalPos;
    NSTimeInterval _startTime;
    BOOL _levelComplete;
    BOOL _fellInHole;
    CGFloat _tiltX;
    CGFloat _tiltY;
    CGFloat _ballScale;
}
@end

@implementation LabyrinthView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor colorWithRed:0.72 green:0.52 blue:0.33 alpha:1.0];
        _walls = [NSMutableArray array];
        _holes = [NSMutableArray array];
        _motionManager = [[CMMotionManager alloc] init];
        [self startDeviceMotion];
        [self setupMaze];
        [self startGame];
    }
    return self;
}

- (void)startDeviceMotion {
    if ([_motionManager isDeviceMotionAvailable]) {
        _motionManager.deviceMotionUpdateInterval = 1.0 / 60.0;
        [_motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue]
                                            withHandler:^(CMDeviceMotion *motion, NSError *error) {
            _tiltX = motion.gravity.x;
            _tiltY = motion.gravity.y;
        }];
    }
}

- (void)setupMaze {
    [_walls removeAllObjects];
    [_holes removeAllObjects];
    
    CGFloat w = self.bounds.size.width;
    CGFloat h = self.bounds.size.height;
    if (w <= 0) { w = 320; h = 480; }
    
    // Outer border walls
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(10, 10, w - 20, 8)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(10, h - 18, w - 20, 8)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(10, 10, 8, h - 20)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(w - 18, 10, 8, h - 20)]];
    
    // Maze internal baffles
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(18, 100, 180, 8)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(w - 190, 190, 172, 8)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(18, 280, 200, 8)]];
    [_walls addObject:[NSValue valueWithCGRect:CGRectMake(w - 180, 360, 162, 8)]];
    
    // Peril holes
    [_holes addObject:[NSValue valueWithCGPoint:CGPointMake(90, 60)]];
    [_holes addObject:[NSValue valueWithCGPoint:CGPointMake(240, 145)]];
    [_holes addObject:[NSValue valueWithCGPoint:CGPointMake(80, 235)]];
    [_holes addObject:[NSValue valueWithCGPoint:CGPointMake(250, 320)]];
    [_holes addObject:[NSValue valueWithCGPoint:CGPointMake(120, 400)]];
    
    _goalPos = CGPointMake(w - 50, h - 50);
}

- (void)startGame {
    _ballPos = CGPointMake(45, 45);
    _ballVel = CGPointZero;
    _ballScale = 1.0;
    _fellInHole = NO;
    _levelComplete = NO;
    _startTime = [NSDate timeIntervalSinceReferenceDate];
    
    [_displayLink invalidate];
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(gameLoop:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)pauseGame {
    _displayLink.paused = YES;
    [_motionManager stopDeviceMotionUpdates];
}

- (void)resumeGame {
    _displayLink.paused = NO;
    [self startDeviceMotion];
}

- (void)resetGame {
    [self startGame];
}

- (void)gameLoop:(CADisplayLink *)link {
    if (_levelComplete) return;
    
    if (_fellInHole) {
        _ballScale *= 0.88;
        if (_ballScale < 0.05) {
            [self resetGame];
        }
        [self setNeedsDisplay];
        return;
    }
    
    // Physics update with 3-axis gyroscope gravity
    CGFloat ax = _tiltX * 0.45;
    CGFloat ay = -_tiltY * 0.45; // Invert for screen coordinates
    
    _ballVel.x = (_ballVel.x + ax) * 0.98; // Friction
    _ballVel.y = (_ballVel.y + ay) * 0.98;
    
    CGPoint nextPos = CGPointMake(_ballPos.x + _ballVel.x, _ballPos.y + _ballVel.y);
    CGFloat radius = 10.0;
    
    // Wall collisions
    for (NSValue *val in _walls) {
        CGRect r = [val CGRectValue];
        // Test X collision
        CGRect boxX = CGRectMake(nextPos.x - radius, _ballPos.y - radius, radius * 2, radius * 2);
        if (CGRectIntersectsRect(boxX, r)) {
            _ballVel.x = -_ballVel.x * 0.4;
            nextPos.x = _ballPos.x;
            [[SoundManager sharedManager] playBallRollSound];
        }
        // Test Y collision
        CGRect boxY = CGRectMake(_ballPos.x - radius, nextPos.y - radius, radius * 2, radius * 2);
        if (CGRectIntersectsRect(boxY, r)) {
            _ballVel.y = -_ballVel.y * 0.4;
            nextPos.y = _ballPos.y;
            [[SoundManager sharedManager] playBallRollSound];
        }
    }
    
    _ballPos = nextPos;
    
    // Check hole fall
    for (NSValue *hVal in _holes) {
        CGPoint hp = [hVal CGPointValue];
        if (hypot(_ballPos.x - hp.x, _ballPos.y - hp.y) < 14.0) {
            _fellInHole = YES;
            _ballPos = hp;
            [[SoundManager sharedManager] playBombExplodeSound];
            break;
        }
    }
    
    // Check goal reach
    if (hypot(_ballPos.x - _goalPos.x, _ballPos.y - _goalPos.y) < 18.0) {
        _levelComplete = YES;
        NSTimeInterval elapsed = [NSDate timeIntervalSinceReferenceDate] - _startTime;
        [[SoundManager sharedManager] playUnlockAchievementSound];
        [self.delegate labyrinthDidFinishLevel:1 time:elapsed];
        [self.delegate labyrinthDidUnlockAchievement:@"Maze Runner" points:50];
    }
    
    [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect {
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    
    // Draw Brass Walls
    [[UIColor colorWithRed:0.85 green:0.75 blue:0.4 alpha:1.0] setFill];
    for (NSValue *val in _walls) {
        CGRect r = [val CGRectValue];
        UIBezierPath *p = [UIBezierPath bezierPathWithRoundedRect:r cornerRadius:2];
        [p fill];
        [[UIColor colorWithRed:0.45 green:0.35 blue:0.1 alpha:1.0] setStroke];
        p.lineWidth = 1;
        [p stroke];
    }
    
    // Draw Dark Peril Holes
    [[UIColor blackColor] setFill];
    for (NSValue *hVal in _holes) {
        CGPoint hp = [hVal CGPointValue];
        CGContextFillEllipseInRect(ctx, CGRectMake(hp.x - 14, hp.y - 14, 28, 28));
        [[UIColor colorWithWhite:0.2 alpha:0.8] setStroke];
        CGContextStrokeEllipseInRect(ctx, CGRectMake(hp.x - 14, hp.y - 14, 28, 28));
    }
    
    // Draw Goal Hole (Gold ring)
    [[UIColor colorWithRed:0.95 green:0.85 blue:0.2 alpha:1.0] setStroke];
    CGContextSetLineWidth(ctx, 3.0);
    CGContextStrokeEllipseInRect(ctx, CGRectMake(_goalPos.x - 16, _goalPos.y - 16, 32, 32));
    
    // Draw Chrome Steel Ball with 3D Specular Highlight
    CGContextSaveGState(ctx);
    CGContextTranslateCTM(ctx, _ballPos.x, _ballPos.y);
    CGContextScaleCTM(ctx, _ballScale, _ballScale);
    
    // Ball shadow
    [[UIColor colorWithWhite:0.1 alpha:0.6] setFill];
    CGContextFillEllipseInRect(ctx, CGRectMake(-8, -6, 18, 18));
    
    // Ball metallic gradient
    [[UIColor colorWithRed:0.8 green:0.85 blue:0.9 alpha:1.0] setFill];
    CGContextFillEllipseInRect(ctx, CGRectMake(-10, -10, 20, 20));
    
    // Specular shine
    [[UIColor whiteColor] setFill];
    CGContextFillEllipseInRect(ctx, CGRectMake(-6, -6, 6, 6));
    CGContextRestoreGState(ctx);
}

- (void)dealloc {
    [_displayLink invalidate];
    [_motionManager stopDeviceMotionUpdates];
}

@end
