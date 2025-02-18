export const listToDict = (props: [string, string][]) => {
  return props.reduce(
    (acc, [key, value]) => {
      acc[key] = value.includes(".") ? parseFloat(value) : parseInt(value, 10);
      return acc;
    },
    {} as Record<string, number>
  );
};
