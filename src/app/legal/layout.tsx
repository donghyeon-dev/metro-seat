import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          ← 자리요로 돌아가기
        </Link>
      </nav>
      <article className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
        {children}
      </article>
      <footer className="mt-12 flex gap-4 text-xs text-gray-500">
        <Link href="/terms" className="hover:underline">이용약관</Link>
        <Link href="/privacy" className="hover:underline">개인정보처리방침</Link>
        <Link href="/disclaimer" className="hover:underline">주의사항</Link>
      </footer>
    </div>
  );
}
