# WedgeCLOCKin Employee, Face and OT Update V3.1

This update is applied after the Manager Security and Attendance V3 files.

## Included

- Removes overtime and replacement-claim details from the employee portal.
- Keeps overtime review, approval, payroll allocation and claim-hour controls in the manager dashboard.
- Detects overtime only in completed 30-minute blocks: 0–29 = 0, 30–59 = 30, 60–89 = 60.
- Preserves the scheduled end and actual clock-out timestamps for audit and manager correction.
- Repairs stale face-registration flags from the encrypted face record without returning face ciphertext or the employee image to the browser.
- Shows `Re-register securely` when an old face flag exists but complete encrypted face data is unavailable.

## Legal implementation note

The 30-minute rounding rule is a company operational policy. Section 60A of Malaysia's Employment Act 1955 defines overtime as work beyond normal hours and does not itself prescribe this rounding method. Confirm the policy against current employment contracts and professional labour advice before using it for live payroll.

