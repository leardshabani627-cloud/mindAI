import { serif } from "@/lib/fonts";

/** The "Mind" wordmark, in the elegant serif (sign-in pages and the app's top bar). */
export default function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`${serif.className} tracking-tight text-[#1f3b2c] ${className}`}>Mind</span>;
}
