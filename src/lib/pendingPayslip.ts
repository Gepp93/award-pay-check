// Keep the raw payslip in memory only, never in browser history or storage.
let pendingPayslip: File | undefined;

export function preloadPayslip(file: File) {
  pendingPayslip = file;
}

export function takePreloadedPayslip() {
  const file = pendingPayslip;
  pendingPayslip = undefined;
  return file;
}