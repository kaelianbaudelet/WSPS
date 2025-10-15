import Link from "next/link";

export default function Unauthorized() {
    return (
        <div>
            <h1>401 - Non autorisé</h1>
            <p>Veuillez vous connecter pour accéder à cette page.</p>
            <Link href="/">Connexion</Link>
        </div>
    );
}

export const metadata = {
    title: "Non autorisé",
    description: "Veuillez vous connecter pour accéder à cette page.",
};
