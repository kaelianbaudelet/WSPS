export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="h-dvh justify-center items-center flex relative flex-1 w-full">
            <div className="grid min-h-svh w-full px-6">
                <div className="flex flex-1 items-center justify-center">{children}</div>
            </div>
        </main>
    );
}
