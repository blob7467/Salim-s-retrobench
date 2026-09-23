struct timespec {
    long tv_sec;
    long tv_nsec;
};

void darwin_nanosleep(long sec, long nsec) {
    struct timespec req = { sec, nsec };
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

int main(int argc, char *argv[]) {
    for (int i = 0; i < 3600; i++) {
        darwin_nanosleep(1, 0);
    }
    return 0;
}
