export const getRandomInt = (
  min: number = 0,
  max: number = 1,
  step: number = 1
) => {
  const range = (max - min) / step;
  return min + step * Math.floor(Math.random() * range);
};
