import struct, hashlib, plistlib, os

# Create a mock CodeDirectory blob for Mach-O
def create_code_directory(bin_data, identifier="com.retroarcade.iphone4"):
    # CSMAGIC_CODEDIRECTORY = 0xfade0c02
    page_size = 4096
    n_code_slots = (len(bin_data) + page_size - 1) // page_size
    n_special_slots = 0
    
    # Hash each 4096-byte page
    page_hashes = b""
    for i in range(n_code_slots):
        page = bin_data[i*page_size : (i+1)*page_size]
        page_hashes += hashlib.sha1(page).digest()
        
    ident_bytes = identifier.encode('utf-8') + b'\x00'
    ident_offset = 8 * 4 + 4 + 4 + 4 + 4 + 4 + 4 # header size
    hash_offset = ident_offset + len(ident_bytes)
    total_len = hash_offset + len(page_hashes)
    
    # uint32_t magic;           /* magic number (CSMAGIC_CODEDIRECTORY) */
    # uint32_t length;          /* total length of CodeDirectory blob */
    # uint32_t version;         /* compatibility version */
    # uint32_t flags;           /* setup and error flags */
    # uint32_t hashOffset;      /* offset of hash array */
    # uint32_t identOffset;     /* offset of identifier string */
    # uint32_t nSpecialSlots;   /* number of special hash slots */
    # uint32_t nCodeSlots;      /* number of ordinary (code) hash slots */
    # uint32_t codeLimit;       /* limit to which hashes apply */
    # uint8_t  hashSize;        /* size of each hash in bytes (20 for sha1) */
    # uint8_t  hashType;        /* type of each hash (1 for sha1) */
    # uint8_t  unused;          /* unused (must be zero) */
    # uint8_t  pageSize;        /* log2(page size in bytes); 12 for 4096 */
    # uint32_t unused2;         /* unused (must be zero) */
    
    header = struct.pack(
        '>IIIIIIIIIBBBBI',
        0xfade0c02,
        total_len,
        0x20100, # version 2.1
        0,       # flags
        hash_offset,
        ident_offset,
        n_special_slots,
        n_code_slots,
        len(bin_data),
        20,      # sha1
        1,       # CS_HASHTYPE_SHA1
        0,
        12,      # 1<<12 = 4096
        0
    )
    
    blob = header + ident_bytes + page_hashes
    
    # Wrap in CSMAGIC_EMBEDDED_SIGNATURE superblob
    # uint32_t magic; /* CSMAGIC_EMBEDDED_SIGNATURE (0xfade0cc0) */
    # uint32_t length;
    # uint32_t count;
    # struct { uint32_t type; uint32_t offset; } blobs[1];
    superblob_header = struct.pack('>III', 0xfade0cc0, 12 + 8 + len(blob), 1)
    superblob_index = struct.pack('>II', 0, 12 + 8) # type 0 = CSSLOT_CODEDIRECTORY
    return superblob_header + superblob_index + blob

print("Tester ready")
