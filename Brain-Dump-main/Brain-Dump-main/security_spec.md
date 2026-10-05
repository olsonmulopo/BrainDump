# Security Specification: Brain Dump Firestore Rules

## 1. Data Invariants
1. **User Identity Invariant**: User documents in `/users/{userId}` can only be read, created, and updated by the authenticated owner (`request.auth.uid == userId`). PII (email) is never accessible by third parties.
2. **Workspace Ownership Invariant**: Workspaces in `/workspaces/{workspaceId}` must have an immutable `ownerId` that matches the authenticated user (`request.auth.uid`). No user can create or update a workspace on behalf of another user.
3. **No Blanket List Access**: List queries on `/workspaces` must enforce `resource.data.ownerId == request.auth.uid`. Unauthenticated or cross-tenant list scans are blocked at the rule level.
4. **ID Hardening Invariant**: All document IDs (`userId`, `workspaceId`) must be valid alphanumeric/underscore/hyphen strings up to 128 characters.
5. **Payload Boundary Limits**: String fields (title, ownerId, etc.) are strictly bounded by size limits (`title.size() <= 256`, `ownerId.size() <= 128`) to prevent memory exhaustion and Denial-of-Wallet attacks.
6. **Immutability of Key Invariants**: On update, `incoming().ownerId == existing().ownerId` and `incoming().id == existing().id`.

---

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity, and State)

1. **Payload 1: Unauthenticated Read of User Profile**
   - Path: `get /users/user_victim`
   - Auth: `null`
   - Expected: `PERMISSION_DENIED`
2. **Payload 2: Cross-User Profile Read (PII Snooping)**
   - Path: `get /users/user_victim`
   - Auth: `{ uid: 'user_attacker' }`
   - Expected: `PERMISSION_DENIED`
3. **Payload 3: Identity Spoofing on Workspace Creation**
   - Path: `create /workspaces/ws_spoof`
   - Auth: `{ uid: 'user_attacker' }`
   - Payload: `{ id: 'ws_spoof', ownerId: 'user_victim', title: 'Hacked', version: 2 }`
   - Expected: `PERMISSION_DENIED`
4. **Payload 4: Anonymous / Unauthenticated Workspace Creation**
   - Path: `create /workspaces/ws_anon`
   - Auth: `null`
   - Payload: `{ id: 'ws_anon', ownerId: 'anon', title: 'Anon', version: 2 }`
   - Expected: `PERMISSION_DENIED`
5. **Payload 5: Blanket Workspace List Query without Owner Filter**
   - Path: `list /workspaces`
   - Auth: `{ uid: 'user_attacker' }`
   - Query: Blanket query without ownerId filter
   - Expected: `PERMISSION_DENIED`
6. **Payload 6: Workspace Ownership Hijacking on Update**
   - Path: `update /workspaces/ws_mine`
   - Auth: `{ uid: 'user_owner' }`
   - Payload: `{ ownerId: 'user_victim' }`
   - Expected: `PERMISSION_DENIED`
7. **Payload 7: Cross-User Workspace Update**
   - Path: `update /workspaces/ws_victim`
   - Auth: `{ uid: 'user_attacker' }`
   - Payload: `{ title: 'Defaced' }`
   - Expected: `PERMISSION_DENIED`
8. **Payload 8: Cross-User Workspace Deletion**
   - Path: `delete /workspaces/ws_victim`
   - Auth: `{ uid: 'user_attacker' }`
   - Expected: `PERMISSION_DENIED`
9. **Payload 9: Giant String Injection in Document ID (ID Poisoning)**
   - Path: `create /workspaces/very_long_string_over_128_chars...`
   - Auth: `{ uid: 'user_attacker' }`
   - Expected: `PERMISSION_DENIED`
10. **Payload 10: Missing Required Keys on Workspace Creation**
    - Path: `create /workspaces/ws_incomplete`
    - Auth: `{ uid: 'user_attacker' }`
    - Payload: `{ id: 'ws_incomplete' }` (missing ownerId, title, version)
    - Expected: `PERMISSION_DENIED`
11. **Payload 11: Oversized Title Injection (Resource Exhaustion)**
    - Path: `create /workspaces/ws_giant_title`
    - Auth: `{ uid: 'user_attacker' }`
    - Payload: `{ id: 'ws_giant_title', ownerId: 'user_attacker', title: 'A'.repeat(500), version: 2 }`
    - Expected: `PERMISSION_DENIED`
12. **Payload 12: Catch-All Infiltration on Undefined Collection**
    - Path: `create /system_config/secret`
    - Auth: `{ uid: 'user_attacker' }`
    - Expected: `PERMISSION_DENIED`

---

## 3. The Test Runner Reference
The test runner structure executes each Dirty Dozen payload against the local emulator / security rule test assertions, ensuring all 12 are strictly rejected with `PERMISSION_DENIED`.
