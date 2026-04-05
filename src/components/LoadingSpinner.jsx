export default function LoadingSpinner({ fullScreen = true }) {
  return (
    <div
      className={fullScreen ? 'fixed inset-0 flex items-center justify-center bg-gradient-radial' : 'flex items-center justify-center p-8'}
      style={{ background: fullScreen ? undefined : 'transparent' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(59,91,219,0.15)',
            borderTopColor: 'var(--indigo)',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
