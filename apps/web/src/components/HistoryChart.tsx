import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { trpc } from "../trpc/client";

export function HistoryChart() {
    const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
    const [days, setDays] = useState(30);
    const { data, isLoading } = trpc.historicalRates.getHistory.useQuery({
        currency,
        limit: days,
    });

    const chartData = useMemo(() => {
        if (!data) return [];
        // Data comes ordered by date desc, we want a chart from left (old) to right (new)
        return [...data]
            .reverse()
            .map((item) => {
                // Parse the date as a local calendar date, not a UTC timestamp.
                // The API returns dates like "2026-01-22T00:00:00.000Z" which represent
                // calendar dates, not specific moments in time. We extract YYYY-MM-DD
                // and create a local Date to avoid timezone offset issues.
                const datePart = item.date.split("T")[0]; // "2026-01-22"
                const [year, month, day] = datePart.split("-").map(Number);
                const localDate = new Date(year, month - 1, day); // month is 0-indexed

                return {
                    date: localDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                    }),
                    fullDate: localDate.toLocaleDateString(),
                    value: parseFloat(item.rate),
                };
            });
    }, [data]);

    const toggleCurrency = (c: "USD" | "EUR") => setCurrency(c);

    if (isLoading) {
        return (
            <div className="h-64 w-full animate-pulse rounded-xl bg-gray-100/10" />
        );
    }

    // Define colors based on currency
    const isUsd = currency === "USD";
    const color = isUsd ? "#10b981" : "#3b82f6"; // Emerald for USD, Blue for EUR

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex w-full items-center justify-center gap-1 rounded-lg bg-gray-900/50 p-1">
                    <button
                        onClick={() => toggleCurrency("USD")}
                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${currency === "USD"
                            ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                            : "text-gray-400 hover:text-gray-200"
                            }`}
                    >
                        USD
                    </button>
                    <button
                        onClick={() => toggleCurrency("EUR")}
                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${currency === "EUR"
                            ? "bg-blue-500/20 text-blue-400 shadow-sm"
                            : "text-gray-400 hover:text-gray-200"
                            }`}
                    >
                        EUR
                    </button>
                </div>
                <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-gray-700 text-gray-400">
                    No history available for {currency}.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center gap-1 rounded-lg bg-gray-900/50 p-1">
                        <button
                            onClick={() => toggleCurrency("USD")}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${currency === "USD"
                                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                                : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            USD
                        </button>
                        <button
                            onClick={() => toggleCurrency("EUR")}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${currency === "EUR"
                                ? "bg-blue-500/20 text-blue-400 shadow-sm"
                                : "text-gray-400 hover:text-gray-200"
                                }`}
                        >
                            EUR
                        </button>
                    </div>
                </div>

                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="rounded-lg border border-gray-700 bg-gray-900/50 px-2 py-1 text-xs text-gray-300 outline-none focus:border-purple-500"
                >
                    <option value={7}>7d</option>
                    <option value={14}>14d</option>
                    <option value={30}>30d</option>
                    <option value={90}>90d</option>
                </select>
            </div>

            <div className="h-64 w-full rounded-xl border border-white/5 bg-gray-900/20 p-4 shadow-xl backdrop-blur-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#ffffff10"
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            minTickGap={30}
                        />
                        <YAxis
                            domain={["auto", "auto"]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            width={35}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "0.5rem",
                                color: "#fff",
                            }}
                            labelStyle={{ color: "#9ca3af", marginBottom: "0.25rem" }}
                            formatter={(value: any) => [
                                `Bs. ${Number(value).toFixed(2)}`,
                                "Rate",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
