const WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

export const numberWord = (n: number) => WORDS[n] ?? String(n);
export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
export const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** 0.5552 -> "55.5%" (digits = 1) or "56%" (digits = 0) */
export const percent = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`;

/** 7.5 -> "7.5", 8 -> "8" */
export const trim = (x: number, digits = 1) => String(Number(x.toFixed(digits)));
