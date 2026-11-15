// money.ts – helper for paise conversion
export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const fromPaise = (paise: number): number => paise / 100;
