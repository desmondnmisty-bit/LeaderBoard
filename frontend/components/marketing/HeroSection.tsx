import Link from 'next/link';

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden py-16 sm:py-24">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text-primary mb-6">
                    <span className="block">Compete in Real-Time</span>
                    <span className="block text-primary">Dominate the Leaderboard</span>
                </h1>
                <p className="mt-4 text-xl text-text-secondary max-w-2xl mx-auto mb-10">
                    Experience the thrill of live updates. Watch ranks change instantly as scores roll in.
                    Secure, fast, and built for the modern web.
                </p>
                <div className="flex justify-center gap-4">
                    <a
                        href="#live-demo"
                        className="px-8 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-transform transform hover:-translate-y-0.5 shadow-lg"
                    >
                        View Live Demo
                    </a>
                    <Link
                        href="/admin"
                        className="px-8 py-3 rounded-md bg-bg-tertiary text-text-primary border border-border-color font-medium hover:bg-bg-secondary transition-colors"
                    >
                        Admin Dashboard
                    </Link>
                </div>
            </div>

            {/* Abstract Background Element */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        </section>
    );
}
