import Link from "next/link";

export default function Forbidden() {
    return (
        <div>
            <h2>Accès Interdit</h2>
            <p>Vous n'êtes pas autorisé à accéder à cette ressource.</p>
            <Link href="/">Retour à l'accueil</Link>
        </div>
    );
}

export const metadata = {
    title: "Interdit",
    description: "Vous n'êtes pas autorisé à accéder à cette ressource.",
};
