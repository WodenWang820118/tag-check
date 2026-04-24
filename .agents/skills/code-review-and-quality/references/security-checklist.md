# Security Review Checklist

This checklist provides a more detailed set of questions for the "Security" axis of a code review. For comprehensive guidance, activate the `security-and-hardening` skill.

## Top 10 Security Checks

- **[ ] Input Validation:** Is all untrusted input (from users, network, files, etc.) validated at a system boundary?
  - Are types, lengths, formats, and ranges checked?
  - Is an allow-list used for validation where possible?

- **[ ] Output Encoding:** Is all data being sent to a UI, browser, or other interpreter properly encoded to prevent injection attacks?
  - Is HTML contextually encoded to prevent Cross-Site Scripting (XSS)?
  - Are shell commands built safely, without including raw user input?

- **[ ] Authentication:** Are all sensitive endpoints protected?
  - Is the user's identity verified on every request that requires it?
  - Is there protection against brute-force attacks (e.g., rate limiting)?

- **[ ] Authorization:** After authenticating, is the user actually allowed to perform the requested action?
  - Is there a check for roles or permissions (e.g., `is_admin`)?
  - Can a user access or modify another user's data (Insecure Direct Object Reference)?

- **[ ] SQL Injection:** Are all database queries parameterized?
  - Is user input ever concatenated directly into a SQL string? (This is a critical vulnerability).

- **[ ] Secrets Management:** Are secrets (API keys, passwords, tokens) kept out of version control?
  - Are they loaded from environment variables or a secrets management service?
  - Are they logged or otherwise exposed?

- **[ ] Dependency Security:** Have third-party dependencies been scanned for known vulnerabilities?
  - Run `npm audit`, `snyk`, or a similar tool.

- **[ ] Error Handling:** Do error messages expose sensitive information?
  - Stack traces, database errors, or internal paths should not be shown to users in a production environment.

- **[ ] Cross-Site Request Forgery (CSRF):** Are state-changing requests (e.g., POST, DELETE) protected from CSRF?
  - This is often handled by a framework's anti-forgery token mechanism. Verify it is enabled and used.

- **[ ] Untrusted Deserialization:** Is the application deserializing data from untrusted sources?
  - This can lead to remote code execution if the data contains malicious payloads. Ensure the data is from a trusted source or that the deserialization is safe.
