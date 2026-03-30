export default function PageHeader({ title, description, children }) {
    return (
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">{title}</h1>
                {description && (
                    <p className="mt-1.5 text-sm text-on-surface-variant max-w-lg">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}
