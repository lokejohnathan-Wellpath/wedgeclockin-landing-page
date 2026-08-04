# WedgeCLOCKin employee password reset V3.4

This amendment makes the employee password setup screen respond to the server's live security state rather than relying only on cached browser data.

- HTTP 428 `PASSWORD_CHANGE_REQUIRED` immediately opens mandatory password setup.
- Attendance, leave and employment data do not load until setup succeeds.
- The clock-in camera closes when password setup is required.
- The corrected security state is written back to the employee's browser session.

Validation: ESLint, 13 frontend tests, TypeScript and the full 45-route production build passed.
