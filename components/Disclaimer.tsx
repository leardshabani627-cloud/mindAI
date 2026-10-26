// Shown once, on first launch, until it is accepted.
export default function Disclaimer({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-[var(--card-solid)] px-6 py-6">
        <h2 className="mb-3 text-xl">Before we start</h2>
        <p>I&apos;m an AI companion, not a replacement for a therapist or the people in your life.</p>
        <p className="mt-3 text-[var(--muted)]">
          Jam një shoqërues AI, jo zëvendësues i një terapisti apo i njerëzve në jetën tënde.
        </p>
        <button onClick={onAccept} className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-5 py-3 text-[var(--on-accent)]">
          I understand / E kuptoj
        </button>
      </div>
    </div>
  );
}
