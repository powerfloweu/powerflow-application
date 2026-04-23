import TabBar from "./TabBar";

interface Props {
  children: React.ReactNode;
}

/**
 * AppShell wraps all authenticated app routes.
 * - Renders <TabBar> at the bottom on mobile (hidden on md+)
 * - Adds bottom padding so content clears the tab bar
 * - The top NavBar is hidden within the app shell; the per-page
 *   header handles identity / back navigation instead.
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#050608] pt-[env(safe-area-inset-top)]">
      {/* Page content — padded so it clears the fixed tab bar on mobile */}
      <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      {/* Bottom tab bar — only visible below md breakpoint */}
      <TabBar />
    </div>
  );
}
