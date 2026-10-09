'use client'

import { useEffect, useState } from 'react'

// shared with the static site on kerelski.com (same origin, same key)
const CONSENT_KEY = 'kerelski_cookie_consent'

const readConsent = () => {
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

const saveConsent = (value: 'granted' | 'denied') => {
  try { localStorage.setItem(CONSENT_KEY, value) } catch {}
}

// a grant queued together with the initial revoke (before fbevents.js has loaded) is ignored by Meta,
// so wait for the real fbq (it defines callMethod) before granting
const grantPixelConsent = () => {
  const fbq: any = window.fbq
  if (!fbq) return
  if (fbq.callMethod) fbq('consent', 'grant')
  else setTimeout(grantPixelConsent, 200)
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  // a previously given consent is re-granted by the pixel snippet in app/layout.tsx
  useEffect(() => {
    if (!readConsent()) setVisible(true)
  }, [])

  if (!visible) return null

  const accept = () => {
    saveConsent('granted')
    grantPixelConsent()
    setVisible(false)
  }

  const reject = () => {
    saveConsent('denied')
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Бисквитки"
      className="fixed inset-x-2.5 bottom-2.5 z-[60] mx-auto flex max-w-3xl flex-col gap-3.5 border-t-2 border-[#c59452] bg-[#252523] px-5 py-4 text-[15px] leading-[22px] text-white shadow-2xl sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:gap-5"
    >
      <p className="flex-1 text-white/85">
        Използваме бисквитки, за да измерваме ефективността на рекламите си.{' '}
        <a href="/privacy-policy" className="text-[#c59452] underline">Политика за поверителност</a>
      </p>
      <div className="flex shrink-0 gap-2.5">
        <button type="button" onClick={reject} className="flex-1 border border-[#c59452] bg-transparent px-[18px] py-2.5 text-sm font-bold tracking-wide text-white">
          Отказвам
        </button>
        <button type="button" onClick={accept} className="flex-1 border border-[#c59452] bg-[#c59452] px-[18px] py-2.5 text-sm font-bold tracking-wide text-white">
          Приемам
        </button>
      </div>
    </div>
  )
}
