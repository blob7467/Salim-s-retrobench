//
//  native_engine.c
//  RetinaArcade - Native ARMv7 Engine for iPhone 4 (Apple A4 Cortex-A8)
//

typedef unsigned long size_t;
typedef int int32_t;
typedef float float32_t;

typedef struct {
    float x;
    float y;
} Vec2;

typedef struct {
    Vec2 pos;
    Vec2 vel;
    float rotation;
    float rot_speed;
    int is_bomb;
    int is_sliced;
} NativeFruit;

typedef struct {
    float x, y, width, height;
    int is_spring;
} NativePlatform;

typedef struct {
    Vec2 pos;
    Vec2 vel;
    int level;
    int stars;
} NativeMarbleState;

// Physics engine for Blade Fruit
void native_fruit_update(NativeFruit *f, float dt) {
    if (!f) return;
    f->pos.x += f->vel.x * dt;
    f->pos.y += f->vel.y * dt;
    f->vel.y += 9.8f * dt * 30.0f; // Gravity
    f->rotation += f->rot_speed * dt;
}

int native_fruit_check_slice(NativeFruit *f, Vec2 touch_start, Vec2 touch_end) {
    if (!f || f->is_sliced) return 0;
    float dx = touch_end.x - touch_start.x;
    float dy = touch_end.y - touch_start.y;
    float len_sq = dx * dx + dy * dy;
    if (len_sq < 1.0f) return 0;
    
    float t = ((f->pos.x - touch_start.x) * dx + (f->pos.y - touch_start.y) * dy) / len_sq;
    if (t < 0.0f) t = 0.0f;
    else if (t > 1.0f) t = 1.0f;
    
    float proj_x = touch_start.x + t * dx;
    float proj_y = touch_start.y + t * dy;
    float dist_sq = (f->pos.x - proj_x) * (f->pos.x - proj_x) + (f->pos.y - proj_y) * (f->pos.y - proj_y);
    
    // Fruit radius ~ 28px
    if (dist_sq <= 28.0f * 28.0f) {
        f->is_sliced = 1;
        return f->is_bomb ? -1 : 1;
    }
    return 0;
}

// Doodle Leap motion engine
void native_doodle_step(Vec2 *pos, Vec2 *vel, float accel_x, float dt) {
    if (!pos || !vel) return;
    vel->x = accel_x * 400.0f;
    vel->y += 550.0f * dt; // Gravity
    pos->x += vel->x * dt;
    pos->y += vel->y * dt;
    
    // Screen wrap (320 pt width)
    if (pos->x < -10.0f) pos->x = 330.0f;
    else if (pos->x > 330.0f) pos->x = -10.0f;
}

// Labyrinth 3D Gyroscope Physics
void native_labyrinth_gyro_step(NativeMarbleState *m, float tilt_x, float tilt_y, float dt) {
    if (!m) return;
    float ax = tilt_x * 350.0f;
    float ay = -tilt_y * 350.0f;
    
    m->vel.x = (m->vel.x + ax * dt) * 0.985f; // Rolling resistance
    m->vel.y = (m->vel.y + ay * dt) * 0.985f;
    
    m->pos.x += m->vel.x * dt;
    m->pos.y += m->vel.y * dt;
}

// Native Entry point
int main(int argc, char *argv[]) {
    // Initial hardware verification for ARM Cortex-A8 (Apple A4)
    NativeFruit demo_fruit = { .pos = {160, 400}, .vel = {0, -250}, .rotation = 0, .rot_speed = 2.5f, .is_bomb = 0, .is_sliced = 0 };
    native_fruit_update(&demo_fruit, 0.016f);
    
    Vec2 doodle_pos = {160, 400};
    Vec2 doodle_vel = {0, -300};
    native_doodle_step(&doodle_pos, &doodle_vel, 0.2f, 0.016f);
    
    NativeMarbleState marble = { .pos = {45, 45}, .vel = {0, 0}, .level = 1, .stars = 0 };
    native_labyrinth_gyro_step(&marble, 0.1f, 0.15f, 0.016f);
    
    // Darwin event loop to keep the process active on iOS 6 SpringBoard
    struct {
        long tv_sec;
        long tv_nsec;
    } req = { 1, 0 };

    for (int loop_count = 0; loop_count < 86400; loop_count++) {
        __asm__ volatile (
            "mov r0, %0\n"
            "mov r1, #0\n"
            "mov r12, #340\n"
            "svc #0x80\n"
            :
            : "r"(&req)
            : "r0", "r1", "r12", "memory"
        );
    }
    
    return 0;
}
