import { Option } from "../select";

export type ChartData = "fft" | "raw";
export type ChartDataMap = Record<ChartData, number[]>;
export type ChartDataLabels = Record<ChartData, string>;

export const chartDataValues: ChartData[] = ["fft", "raw"];
export const chartDataLabels: ChartDataLabels = {
	fft: "FFT",
	raw: "Amplitude"
};
export const chartDataOptions: Option<ChartData>[] = chartDataValues.map(x => ({ value: x, label: chartDataLabels[x] }));