export function BackgroundDecoration() {
    return (
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-indigo-900/20 blur-[120px]" />
            <div className="absolute bottom-[0%] right-[0%] w-[60vh] h-[60vh] rounded-full bg-purple-900/10 blur-[100px]" />
        </div>
    );
}
