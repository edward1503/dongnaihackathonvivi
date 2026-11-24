import "@fontsource/be-vietnam-pro/400.css"
import "@fontsource/be-vietnam-pro/500.css"
import "@fontsource/be-vietnam-pro/600.css"
import "@fontsource/be-vietnam-pro/700.css"
import "@fontsource/be-vietnam-pro/800.css"
import React, { useEffect, useState } from "react"
import { Composition, continueRender, delayRender } from "remotion"
import { ThaoTac, type Guide as GuideData } from "./thao-tac"
import lcs1 from "./data/thao-tac/v1.json"

const FPS = 30

function useFonts() {
  const [handle] = useState(() => delayRender("Nạp phông"))
  useEffect(() => {
    const sample = "Lá chắn số Bé Nai ợ ữ Ặ"
    Promise.all(["400", "500", "600", "700", "800"].map(w => document.fonts.load(`${w} 40px "Be Vietnam Pro"`, sample)))
      .then(() => document.fonts.ready).then(() => continueRender(handle), () => continueRender(handle))
  }, [handle])
}

function ThaoTacVideo({ g }: { g: GuideData }) {
  useFonts()
  return <ThaoTac g={g} />
}

export function Root() {
  return <Composition id="LCS1" component={ThaoTacVideo as never}
    durationInFrames={Math.round((lcs1 as unknown as GuideData).seconds * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{ g: lcs1 }} />
}
