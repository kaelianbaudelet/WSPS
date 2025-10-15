import SiteNavbar from "./components/navbar";
import Footer from "./components/sections/footer";

export default async function SiteLayout(props: { children: React.ReactNode }) {
    return (
        <main className="min-h-dvh">
            <SiteNavbar />
            {props.children}
            <Footer />
        </main>
    );
}
