//
//  DoodleLeapView.m
//  RetinaArcade
//

#import "DoodleLeapView.h"
#import "SoundManager.h"
#import <QuartzCore/QuartzCore.h>

@interface PlatformItem : NSObject
@property (nonatomic, assign) CGRect rect;
@property (nonatomic, assign) BOOL isBroken;
@property (nonatomic, assign) BOOL isSpring;
@end

@implementation PlatformItem
@end

@interface DoodleLeapView () {
    CADisplayLink *_displayLink;
    CMMotionManager *_motionManager;
    CGPoint _doodlePos;
    CGPoint _doodleVel;
    NSMutableArray *_platforms;
    CGFloat _cameraY;
    NSInteger _maxHeight;
    BOOL _gameOver;
    CGFloat _tiltX;
}
@end

@implementation DoodleLeapView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor colorWithPatternImage:[UIImage imageNamed:@"graph_paper.png"]];
        if (!self.backgroundColor) {
            self.backgroundColor = [UIColor colorWithRed:0.96 green:0.96 blue:0.92 alpha:1.0];
        }
        _platforms = [NSMutableArray array];
        _motionManager = [[CMMotionManager alloc] init];
        [self startMotionUpdates];
        [self startGame];
    }
    return self;
}

- (void)startMotionUpdates {
    if ([_motionManager isAccelerometerAvailable]) {
        _motionManager.accelerometerUpdateInterval = 1.0 / 60.0;
        [_motionManager startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue]
                                             withHandler:^(CMAccelerometerData *data, NSError *error) {
            _tiltX = data.acceleration.x;
        }];
    }
}

- (void)startGame {
    _doodlePos = CGPointMake(self.bounds.size.width / 2.0, self.bounds.size.height - 120);
    _doodleVel = CGPointMake(0, -9.0);
    _cameraY = 0;
    _maxHeight = 0;
    _gameOver = NO;
    
    [_platforms removeAllObjects];
    
    // Initial starting base platform
    PlatformItem *base = [[PlatformItem alloc] init];
    base.rect = CGRectMake(self.bounds.size.width / 2.0 - 35, self.bounds.size.height - 60, 70, 14);
    [_platforms addObject:base];
    
    // Generate platforms up to screen height
    CGFloat curY = self.bounds.size.height - 120;
    while (curY > -400) {
        PlatformItem *p = [[PlatformItem alloc] init];
        CGFloat rx = 20 + arc4random_uniform((uint32_t)(self.bounds.size.width - 90));
        p.rect = CGRectMake(rx, curY, 64, 12);
        if (arc4random_uniform(100) < 10) {
            p.isSpring = YES;
        }
        [_platforms addObject:p];
        curY -= 50 + arc4random_uniform(40);
    }
    
    [_displayLink invalidate];
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(gameLoop:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)pauseGame {
    _displayLink.paused = YES;
    [_motionManager stopAccelerometerUpdates];
}

- (void)resumeGame {
    _displayLink.paused = NO;
    [self startMotionUpdates];
}

- (void)resetGame {
    [self startGame];
}

- (void)gameLoop:(CADisplayLink *)link {
    if (_gameOver) return;
    
    // Apply accelerometer tilt
    _doodleVel.x = _tiltX * 14.0;
    _doodleVel.y += 0.28; // Gravity
    
    _doodlePos.x += _doodleVel.x;
    _doodlePos.y += _doodleVel.y;
    
    // Screen wrap
    CGFloat w = self.bounds.size.width;
    if (_doodlePos.x < -15) _doodlePos.x = w + 15;
    else if (_doodlePos.x > w + 15) _doodlePos.x = -15;
    
    // Platform collision when falling
    if (_doodleVel.y > 0) {
        CGRect doodleFeet = CGRectMake(_doodlePos.x - 14, _doodlePos.y + 16, 28, 6);
        for (PlatformItem *p in _platforms) {
            if (CGRectIntersectsRect(doodleFeet, p.rect)) {
                if (p.isSpring) {
                    _doodleVel.y = -18.0; // High super jump
                    [[SoundManager sharedManager] playBounceSound];
                } else {
                    _doodleVel.y = -9.2; // Standard jump
                    [[SoundManager sharedManager] playBounceSound];
                }
                break;
            }
        }
    }
    
    // Camera scroll up
    CGFloat targetY = self.bounds.size.height * 0.45;
    if (_doodlePos.y < targetY) {
        CGFloat diff = targetY - _doodlePos.y;
        _doodlePos.y = targetY;
        _cameraY += diff;
        _maxHeight = (NSInteger)_cameraY;
        
        for (PlatformItem *p in _platforms) {
            CGRect r = p.rect;
            r.origin.y += diff;
            p.rect = r;
        }
        
        // Spawn higher platforms as needed
        PlatformItem *highest = [_platforms lastObject];
        if (highest.rect.origin.y > -50) {
            PlatformItem *newP = [[PlatformItem alloc] init];
            CGFloat rx = 20 + arc4random_uniform((uint32_t)(self.bounds.size.width - 90));
            newP.rect = CGRectMake(rx, highest.rect.origin.y - (55 + arc4random_uniform(35)), 64, 12);
            [_platforms addObject:newP];
        }
    }
    
    // Fall into abyss
    if (_doodlePos.y > self.bounds.size.height + 40) {
        _gameOver = YES;
        [[SoundManager sharedManager] playBombExplodeSound];
        [self.delegate doodleLeapDidFinishWithScore:_maxHeight];
        if (_maxHeight > 1000) {
            [self.delegate doodleLeapDidUnlockAchievement:@"Sky High Hopper" points:50];
        }
    }
    
    [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect {
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    
    // Draw Platforms
    for (PlatformItem *p in _platforms) {
        if (p.rect.origin.y > -20 && p.rect.origin.y < self.bounds.size.height + 20) {
            if (p.isSpring) {
                [[UIColor colorWithRed:0.2 green:0.8 blue:0.3 alpha:1.0] setFill];
            } else {
                [[UIColor colorWithRed:0.4 green:0.75 blue:0.2 alpha:1.0] setFill];
            }
            UIBezierPath *path = [UIBezierPath bezierPathWithRoundedRect:p.rect cornerRadius:5];
            [path fill];
            [[UIColor colorWithRed:0.2 green:0.45 blue:0.1 alpha:1.0] setStroke];
            path.lineWidth = 1.5;
            [path stroke];
            
            if (p.isSpring) {
                [[UIColor darkGrayColor] setStroke];
                CGContextStrokeRect(ctx, CGRectMake(p.rect.origin.x + 24, p.rect.origin.y - 6, 16, 6));
            }
        }
    }
    
    // Draw Doodle Character
    NSString *doodle = @"🐸";
    [doodle drawAtPoint:CGPointMake(_doodlePos.x - 18, _doodlePos.y - 18) withFont:[UIFont systemFontOfSize:34]];
    
    // Draw Score
    NSString *scoreText = [NSString stringWithFormat:@"%ld m", (long)_maxHeight];
    [[UIColor colorWithRed:0.2 green:0.2 blue:0.2 alpha:0.9] set];
    [scoreText drawAtPoint:CGPointMake(16, 26) withFont:[UIFont boldSystemFontOfSize:18]];
}

- (void)dealloc {
    [_displayLink invalidate];
    [_motionManager stopAccelerometerUpdates];
}

@end
