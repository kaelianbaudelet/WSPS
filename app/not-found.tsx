export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-4xl font-bold mb-4">Page non trouvée</h2>
            <p className="text-lg text-muted-fg mb-8">
                La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
        </div>
    );
}

export const metadata = {
    title: "Page non trouvée",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
};
