import { useEffect, useRef, type ReactNode } from 'react'
import { buttonStyles } from '../lib/ui'

/**
 * A small modal that asks before something can't be undone. Uses the native <dialog>, so
 * Escape closes it and focus stays inside while it's open.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (event.target === event.currentTarget) onCancel()
      }}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-2xl border border-border bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <h2 id="confirm-title" className="m-0 text-base font-semibold">
            {title}
          </h2>
          <div className="text-sm leading-normal text-ink-2">{children}</div>
          <div className="flex justify-end gap-2">
            <button type="button" autoFocus onClick={onCancel} className={buttonStyles.secondary}>
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className={buttonStyles.dangerSolid}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
