/** Zapněte DEBUG_PERF=1 ve Vercel env pro logy délky v Server Logs. */
export function perfStart(label: string): () => void {
  if (process.env.DEBUG_PERF !== '1') return () => {}
  const start = performance.now()
  return (detail?: string) => {
    const ms = (performance.now() - start).toFixed(0)
    console.log(`[perf] ${label}${detail ? ` (${detail})` : ''}: ${ms}ms`)
  }
}
