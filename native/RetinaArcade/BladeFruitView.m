//
//  BladeFruitView.m
//  RetinaArcade
//

#import "BladeFruitView.h"
#import "SoundManager.h"
#import <QuartzCore/QuartzCore.h>

@interface FruitItem : NSObject
@property (nonatomic, assign) CGPoint position;
@property (nonatomic, assign) CGPoint velocity;
@property (nonatomic, assign) CGFloat rotation;
@property (nonatomic, assign) CGFloat rotationSpeed;
@property (nonatomic, assign) CGFloat radius;
@property (nonatomic, assign) BOOL isBomb;
@property (nonatomic, assign) BOOL isSliced;
@property (nonatomic, strong) NSString *emoji;
@property (nonatomic, assign) CGFloat sliceProgress;
@end

@implementation FruitItem
@end

@interface BladeFruitView () {
    CADisplayLink *_displayLink;
    NSMutableArray *_fruits;
    NSMutableArray *_sliceTrail;
    CGPoint _lastTouch;
    NSInteger _score;
    NSInteger _strikes;
    BOOL _gameOver;
    NSTimeInterval _lastSpawnTime;
}
@end

@implementation BladeFruitView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor colorWithRed:0.12 green:0.08 blue:0.05 alpha:1.0];
        self.multipleTouchEnabled = YES;
        _fruits = [NSMutableArray array];
        _sliceTrail = [NSMutableArray array];
        [self startGame];
    }
    return self;
}

- (void)startGame {
    _score = 0;
    _strikes = 0;
    _gameOver = NO;
    [_fruits removeAllObjects];
    [_sliceTrail removeAllObjects];
    
    [_displayLink invalidate];
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(gameLoop:)];
    _displayLink.frameInterval = 1; // 60 FPS on Retina Display
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)pauseGame {
    _displayLink.paused = YES;
}

- (void)resumeGame {
    _displayLink.paused = NO;
}

- (void)resetGame {
    [self startGame];
}

- (void)spawnFruit {
    FruitItem *fruit = [[FruitItem alloc] init];
    CGFloat w = self.bounds.size.width;
    CGFloat h = self.bounds.size.height;
    
    CGFloat startX = 40 + arc4random_uniform(w - 80);
    fruit.position = CGPointMake(startX, h + 20);
    
    CGFloat vx = (arc4random_uniform(160) - 80) / 10.0;
    CGFloat vy = -(13.0 + (arc4random_uniform(50) / 10.0));
    fruit.velocity = CGPointMake(vx, vy);
    fruit.rotation = 0;
    fruit.rotationSpeed = ((int)arc4random_uniform(20) - 10) / 100.0;
    fruit.radius = 26;
    fruit.isSliced = NO;
    
    // 15% chance bomb
    if (arc4random_uniform(100) < 15) {
        fruit.isBomb = YES;
        fruit.emoji = @"💣";
    } else {
        NSArray *types = @[@"🍉", @"🍎", @"🍊", @"🍌", @"🍓", @"🥝", @"🍍"];
        fruit.emoji = types[arc4random_uniform((uint32_t)types.count)];
    }
    
    [_fruits addObject:fruit];
}

- (void)gameLoop:(CADisplayLink *)link {
    if (_gameOver) return;
    
    NSTimeInterval now = link.timestamp;
    if (now - _lastSpawnTime > 1.2) {
        [self spawnFruit];
        if (arc4random_uniform(100) < 40) {
            [self spawnFruit];
        }
        _lastSpawnTime = now;
    }
    
    CGFloat gravity = 0.35;
    NSMutableArray *toRemove = [NSMutableArray array];
    
    for (FruitItem *f in _fruits) {
        CGPoint pos = f.position;
        CGPoint vel = f.velocity;
        
        pos.x += vel.x;
        pos.y += vel.y;
        vel.y += gravity;
        
        f.position = pos;
        f.velocity = vel;
        f.rotation += f.rotationSpeed;
        
        if (f.isSliced) {
            f.sliceProgress += 0.05;
        }
        
        // Fallen off screen
        if (pos.y > self.bounds.size.height + 60 && vel.y > 0) {
            [toRemove addObject:f];
            if (!f.isSliced && !f.isBomb) {
                _strikes++;
                if (_strikes >= 3) {
                    _gameOver = YES;
                    [[SoundManager sharedManager] playBombExplodeSound];
                    [self.delegate bladeFruitDidFinishWithScore:_score];
                }
            }
        }
    }
    
    [_fruits removeObjectsInArray:toRemove];
    
    // Fade slice trail points
    if (_sliceTrail.count > 12) {
        [_sliceTrail removeObjectAtIndex:0];
    }
    
    [self setNeedsDisplay];
}

#pragma mark - Touch Handling

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    UITouch *t = [touches anyObject];
    CGPoint pt = [t locationInView:self];
    _lastTouch = pt;
    [_sliceTrail removeAllObjects];
    [_sliceTrail addObject:[NSValue valueWithCGPoint:pt]];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
    UITouch *t = [touches anyObject];
    CGPoint pt = [t locationInView:self];
    [_sliceTrail addObject:[NSValue valueWithCGPoint:pt]];
    
    // Check intersection with active fruits
    for (FruitItem *f in _fruits) {
        if (!f.isSliced) {
            CGFloat dist = hypot(pt.x - f.position.x, pt.y - f.position.y);
            if (dist < f.radius + 15) {
                f.isSliced = YES;
                if (f.isBomb) {
                    [[SoundManager sharedManager] playBombExplodeSound];
                    _gameOver = YES;
                    [self.delegate bladeFruitDidFinishWithScore:_score];
                } else {
                    _score += 10;
                    [[SoundManager sharedManager] playSliceSound];
                    if (_score == 100) {
                        [self.delegate bladeFruitDidUnlockAchievement:@"Fruit Master" points:50];
                    }
                }
            }
        }
    }
    
    _lastTouch = pt;
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    [_sliceTrail removeAllObjects];
}

#pragma mark - Drawing

- (void)drawRect:(CGRect)rect {
    CGContextRef ctx = UIGraphicsGetCurrentContext();
    
    // Render Slice Katana Trail
    if (_sliceTrail.count > 1) {
        CGContextSetLineWidth(ctx, 4.0);
        CGContextSetStrokeColorWithColor(ctx, [UIColor colorWithRed:0.6 green:0.9 blue:1.0 alpha:0.8].CGColor);
        CGContextSetLineCap(ctx, kCGLineCapRound);
        CGContextSetLineJoin(ctx, kCGLineJoinRound);
        
        CGPoint first = [[_sliceTrail firstObject] CGPointValue];
        CGContextBeginPath(ctx);
        CGContextMoveToPoint(ctx, first.x, first.y);
        
        for (NSUInteger i = 1; i < _sliceTrail.count; i++) {
            CGPoint pt = [_sliceTrail[i] CGPointValue];
            CGContextAddLineToPoint(ctx, pt.x, pt.y);
        }
        CGContextStrokePath(ctx);
    }
    
    // Render Fruits
    UIFont *font = [UIFont systemFontOfSize:38];
    for (FruitItem *f in _fruits) {
        CGContextSaveGState(ctx);
        CGContextTranslateCTM(ctx, f.position.x, f.position.y);
        CGContextRotateCTM(ctx, f.rotation);
        
        if (f.isSliced && !f.isBomb) {
            // Sliced halves split apart
            CGFloat split = f.sliceProgress * 30.0;
            [f.emoji drawAtPoint:CGPointMake(-20 - split, -20) withFont:font];
            [f.emoji drawAtPoint:CGPointMake(-20 + split, -20) withFont:font];
        } else {
            [f.emoji drawAtPoint:CGPointMake(-20, -20) withFont:font];
        }
        
        CGContextRestoreGState(ctx);
    }
    
    // Render HUD: Score & Strikes
    NSString *scoreStr = [NSString stringWithFormat:@"SCORE: %ld", (long)_score];
    [[UIColor whiteColor] set];
    [scoreStr drawAtPoint:CGPointMake(16, 28) withFont:[UIFont boldSystemFontOfSize:15]];
    
    NSString *strikesStr = [NSString stringWithFormat:@"STRIKES: %ld/3", (long)_strikes];
    [[UIColor colorWithRed:1.0 green:0.4 blue:0.4 alpha:1.0] set];
    [strikesStr drawAtPoint:CGPointMake(self.bounds.size.width - 120, 28) withFont:[UIFont boldSystemFontOfSize:15]];
    
    if (_gameOver) {
        NSString *goStr = @"GAME OVER";
        CGSize sz = [goStr sizeWithFont:[UIFont boldSystemFontOfSize:28]];
        [[UIColor redColor] set];
        [goStr drawAtPoint:CGPointMake((self.bounds.size.width - sz.width)/2, self.bounds.size.height/2 - 40) withFont:[UIFont boldSystemFontOfSize:28]];
    }
}

- (void)dealloc {
    [_displayLink invalidate];
}

@end
