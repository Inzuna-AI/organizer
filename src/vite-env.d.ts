/// <reference types="vite/client" />

/** Version aus package.json, wird beim Build eingesetzt */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_VAPID_PUBLIC_KEY?: string
}
