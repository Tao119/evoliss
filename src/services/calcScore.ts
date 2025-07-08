export function calculateScore(item: any, match: number): number {
	const matchScore = match * 6;
	const accessScore = (item.accessCount || 0) * 4;
	return matchScore + accessScore;
}
