export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomFromArray = <T>(arr: T[] | undefined) => {
  return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined;
};
