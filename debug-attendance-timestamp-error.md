# Debug Session: attendance-timestamp-error

**Status:** [OPEN]
**Created:** 2026-06-16
**Session ID:** attendance-timestamp-error

## Bug Description
Error 400 Bad Request saat membuat absensi santri dengan pesan: `invalid input syntax for type timestamp with time zone: ""`

**Error details:**
- URL: `POST https://whdkgllaqrjzqcnwnmih.supabase.co/rest/v1/attendance?columns=%22id%22%2C%22student_id%22%2C%22date%22%2C%22status%22%2C%22created_at%22&select=*`
- Error code: `22007`
- Message: `invalid input syntax for type timestamp with time zone: ""`
- File: `Attendance.tsx:207`

## Hypotheses
1. **Empty date field**: Field `date` dikirim sebagai string kosong `""` ke database
2. **Invalid date format**: Format tanggal tidak sesuai dengan yang diharapkan PostgreSQL
3. **Missing required field**: Field `created_at` tidak diisi dengan nilai default
4. **Data validation issue**: Validasi data di frontend tidak menangani kasus tanggal kosong

## Evidence Collection Plan
1. Instrumentasi fungsi `createAttendance` dan `createAttendanceBatch` di `store.ts`
2. Log data yang dikirim ke Supabase sebelum API call
3. Log error response dari Supabase
4. Trace flow data dari frontend ke backend

## Timeline
### Step 1: Initial Setup
- [x] Generate session ID: attendance-timestamp-error
- [x] Create debug file
- [x] List falsifiable hypotheses
- [x] Start Debug Server
- [x] Add instrumentation logs

### Step 2: Instrumentation
- [x] Instrument `createAttendance` function
- [x] Instrument `createAttendanceBatch` function
- [x] Add logging in `Attendance.tsx`

### Step 3: Reproduction & Analysis
- [ ] Reproduce the error
- [ ] Collect runtime evidence
- [ ] Analyze logs

### Step 4: Fix & Verification
- [x] Implement fix based on evidence
- [ ] Verify fix with post-fix logs
- [ ] Clean up instrumentation

## Logs
*No logs collected yet*

## Root Cause Analysis
*Pending evidence collection*

## Fix Summary
*Pending implementation*

## Cleanup Status
*Not yet started*