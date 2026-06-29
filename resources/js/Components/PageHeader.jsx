export default function PageHeader({ title, description, children }) {
    return (
        <div className="mb-8 flex min-w-0 flex-col items-start gap-4 sm:mb-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:gap-6">
            <div className="min-w-0 w-full flex-1 sm:pr-2">
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface sm:text-4xl">{title}</h1>
                {description && (
                    <p className="mt-1.5 max-w-none text-sm leading-relaxed text-on-surface-variant sm:max-w-lg">{description}</p>
                )}
            </div>
            {children != null ? (
                <div className="flex w-full min-w-0 shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
