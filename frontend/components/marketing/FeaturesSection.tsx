export default function FeaturesSection() {
    const features = [
        {
            title: 'Real-Time Sockets',
            description: 'No refreshing needed. Push updates deliver score changes to all connected clients instantly.',
            icon: '⚡',
        },
        {
            title: 'Secure Admin',
            description: 'Protected dashboard for managing players, scores, and global configuration with ease.',
            icon: '🛡️',
        },
        {
            title: 'Global Analytics',
            description: 'Integrated tracking for player engagement and system performance metrics.',
            icon: '📊',
        },
    ];

    return (
        <section className="py-12 bg-bg-secondary/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="card p-6 hover:border-primary/50 transition-colors duration-300">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">{feature.title}</h3>
                            <p className="text-text-secondary leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
