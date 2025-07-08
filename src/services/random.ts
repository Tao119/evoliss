export const getRandomInt = (min = 0, max = 1, step = 1) => {
	const range = (max - min) / step;
	return min + step * Math.floor(Math.random() * range);
};
