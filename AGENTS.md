# Architecture rules
- Transfer homepage payslip uploads to the existing checker through a consume-once in-memory handoff; avoid persisting sensitive files in browser history or storage.
- Define Ledger styling centrally in global semantic tokens, Tailwind utilities and shared UI primitives; avoid page-specific theme overrides so every page inherits one foundation.