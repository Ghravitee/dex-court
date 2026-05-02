export function ConfigField({
    label,
    hint,
    value,
    current,
    onChange,
}: {
    label: string;
    hint: string;
    value: string;
    current: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
                <label className="text-xs text-white/50">{label}</label>
                <span
                    className="max-w-[160px] truncate font-mono text-xs text-white/30"
                    title={current}
                >
                    {current}
                </span>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={hint}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 transition-colors focus:border-purple-400/50 focus:outline-none"
            />
        </div>
    );
}