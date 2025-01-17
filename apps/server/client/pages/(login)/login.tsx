import { UserAvatar } from "@client/components/ui/user-avatar"
import { useSession } from "@client/query/auth"
import { useAuthProviders } from "@client/query/users"
import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { authProvidersConfig } from "@follow/constants"
import { createSession, loginHandler, signOut } from "@follow/shared/auth"
import { DEEPLINK_SCHEME } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

export function Component() {
  return <Login />
}

function Login() {
  const { status, refetch } = useSession()

  const [redirecting, setRedirecting] = useState(false)

  const { data: authProviders } = useAuthProviders()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const provider = urlParams.get("provider")

  const isAuthenticated = status === "authenticated"

  const { t } = useTranslation("external")

  useEffect(() => {
    if (provider && status === "unauthenticated") {
      loginHandler(provider)
      setRedirecting(true)
    }
  }, [status])

  const getCallbackUrl = useCallback(async () => {
    const { data } = await createSession()
    if (!data) return null
    return {
      url: `${DEEPLINK_SCHEME}auth?ck=${data.ck}&userId=${data.userId}`,
      userId: data.userId,
    }
  }, [])

  const handleOpenApp = useCallback(async () => {
    const callbackUrl = await getCallbackUrl()
    if (!callbackUrl) return
    window.open(callbackUrl.url, "_top")
  }, [getCallbackUrl])

  const onceRef = useRef(false)
  useEffect(() => {
    if (isAuthenticated && !onceRef.current) {
      handleOpenApp()
    }
    onceRef.current = true
  }, [handleOpenApp, isAuthenticated])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-10">
      <Logo className="size-20" />
      {!isAuthenticated && (
        <h1 className="text-3xl font-bold">
          {t("login.logInTo")}
          {` ${APP_NAME}`}
        </h1>
      )}
      {redirecting ? (
        <div>{t("login.redirecting")}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {isAuthenticated ? (
            <div className="flex w-full flex-col items-center justify-center gap-10 px-4">
              <div className="relative flex items-center justify-center">
                <UserAvatar className="gap-4 px-10 py-4 text-2xl" />
                <div className="absolute right-0">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await signOut()
                      await refetch()
                    }}
                  >
                    <i className="i-mingcute-exit-line text-xl" />
                  </Button>
                </div>
              </div>
              <h2 className="text-center">
                {t("redirect.successMessage", { app_name: APP_NAME })} <br />
                <br />
                {t("redirect.instruction", { app_name: APP_NAME })}
              </h2>
              <div className="center flex flex-col gap-20 sm:flex-row">
                <Button
                  variant="text"
                  className="h-14 text-base"
                  onClick={() => {
                    window.location.href = "/"
                  }}
                >
                  {t("redirect.continueInBrowser")}
                </Button>

                <Button className="h-14 !rounded-full px-5 text-lg" onClick={handleOpenApp}>
                  {t("redirect.openApp", { app_name: APP_NAME })}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {Object.entries(authProviders || []).map(([key, provider]) => (
                <Button
                  key={key}
                  buttonClassName={cn(
                    "h-[48px] w-[320px] rounded-[8px] font-sans text-base text-white hover:!bg-black/80 focus:!border-black/80 focus:!ring-black/80",
                    authProvidersConfig[key]?.buttonClassName,
                  )}
                  onClick={() => {
                    loginHandler(key)
                  }}
                >
                  <i className={cn("mr-2 text-xl", authProvidersConfig[key].iconClassName)} />{" "}
                  {t("login.continueWith", { provider: provider.name })}
                </Button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
