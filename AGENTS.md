# Architecture rules
- Transfer homepage payslip uploads to the existing checker through a consume-once in-memory handoff; avoid persisting sensitive files in browser history or storage.
- Scope homepage presentation overrides under `.ap-home` so existing marketing pages and checker styling remain unchanged.