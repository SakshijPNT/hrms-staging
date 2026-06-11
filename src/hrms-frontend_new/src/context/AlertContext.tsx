import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import AlertModal from '../components/AlertModal'
import ConfirmModal from '../components/ConfirmModal'

type AlertOptions = {
  title?: string
  message: string
}

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

type AlertContextValue = {
  showAlert: (options: AlertOptions | string) => void
  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(
    null,
  )
  const confirmResolverRef = useRef<
    ((value: boolean) => void) | null
  >(null)

  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setAlertState({ message: options })
      return
    }

    setAlertState(options)
  }, [])

  const hideAlert = useCallback(() => {
    setAlertState(null)
  }, [])

  const showConfirm = useCallback(
    (options: ConfirmOptions | string): Promise<boolean> => {
      return new Promise((resolve) => {
        confirmResolverRef.current = resolve

        if (typeof options === 'string') {
          setConfirmState({ message: options })
          return
        }

        setConfirmState(options)
      })
    },
    [],
  )

  const closeConfirm = useCallback((confirmed: boolean) => {
    setConfirmState(null)
    confirmResolverRef.current?.(confirmed)
    confirmResolverRef.current = null
  }, [])

  useEffect(() => {
    if (!alertState && !confirmState) {
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [alertState, confirmState])

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        open={!!alertState}
        title={alertState?.title ?? 'Notice'}
        message={alertState?.message ?? ''}
        onClose={hideAlert}
      />
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title ?? 'Confirm'}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'OK'}
        cancelLabel={confirmState?.cancelLabel ?? 'Cancel'}
        onConfirm={() => closeConfirm(true)}
        onCancel={() => closeConfirm(false)}
      />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)

  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }

  return context
}
