export default function PageHeader({ title, description, children }) {
    return (
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">{title}</h1>
                {description && (
                    <p className="mt-1.5 text-sm text-on-surface-variant max-w-lg">{description}</p>
                )}
            </div>
            {children != null ? (
                <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 md:w-auto">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
