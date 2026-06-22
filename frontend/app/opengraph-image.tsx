import { renderHomeOgImage } from "@/lib/seo/og";

export const alt = "CricScore live cricket scores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderHomeOgImage();
}
