interface FormatTimeOptions {
	showZeroHours?: boolean;
	showZeroMinutes?: boolean;
	hourUnit?: string;
	minuteUnit?: string;
	separator?: string;
}

export const formatMinutesToTime = (
	minutes: number,
	options: FormatTimeOptions = {},
): string => {
	const {
		showZeroHours = false,
		showZeroMinutes = false,
		hourUnit = "時間",
		minuteUnit = "分",
		separator = "",
	} = options;

	const totalMinutes = Math.max(0, Math.floor(minutes));

	const hours = Math.floor(totalMinutes / 60);
	const remainingMinutes = totalMinutes % 60;

	const parts: string[] = [];

	if (hours > 0 || showZeroHours) {
		parts.push(`${hours}${hourUnit}`);
	}

	if (remainingMinutes > 0 || showZeroMinutes) {
		parts.push(`${remainingMinutes}${minuteUnit}`);
	}

	if (parts.length === 0) {
		return `0${minuteUnit}`;
	}

	return parts.join(separator);
};

export const formatMinutesToShortTime = (minutes: number): string => {
	return formatMinutesToTime(minutes, {
		hourUnit: "h",
		minuteUnit: "m",
		separator: " ",
		showZeroMinutes: true,
	});
};

export const formatMinutesToColonTime = (minutes: number): string => {
	const totalMinutes = Math.max(0, Math.floor(minutes));
	const hours = Math.floor(totalMinutes / 60);
	const remainingMinutes = totalMinutes % 60;

	if (hours > 0) {
		return `${hours}:${remainingMinutes.toString().padStart(2, "0")}`;
	}

	return `${remainingMinutes}分`;
};

export const formatMinutesToDetailedTime = (minutes: number): string => {
	return formatMinutesToTime(minutes, {
		showZeroHours: true,
		showZeroMinutes: true,
	});
};
