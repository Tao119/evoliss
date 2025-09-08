export const getFormattedDate = (date: Date, format: string): string => {
	if (!(date instanceof Date)) {
		return "";
	}

	const symbol = {
		M: date.getMonth() + 1,  // getMonth()を使用（ローカル時刻）
		d: date.getDate(),        // getDate()を使用
		h: date.getHours(),       // getHours()を使用
		m: date.getMinutes(),     // getMinutes()を使用
		s: date.getSeconds(),     // getSeconds()を使用
	};

	const formatted = format.replace(/(M+|d+|h+|m+|s+)/g, (v) =>
		(
			(v.length > 1 ? "0" : "") + symbol[v.slice(-1) as keyof typeof symbol]
		).slice(-2),
	);

	return formatted.replace(/(y+)/g, (v) =>
		date.getFullYear().toString().slice(-v.length),
	);
};
