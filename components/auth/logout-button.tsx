'use client'

import { useFormStatus } from 'react-dom'
import { LogOut, Loader2 } from 'lucide-react'

export function LogoutSubmitButton({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {children && <span>{children}</span>}
    </button>
  )
}

/**
 * Variant khusus untuk sidebar (ikon saja, tanpa teks)
 */
export function LogoutIconButton({ className }: { className?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Keluar"
      className={className}
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5" />
      )}
    </button>
  )
}
