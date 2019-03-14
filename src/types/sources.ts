import { Option } from "../select";

export type Source = "microphone" | "sine";
export type SourceLabels = Record<Source, string>;

export const sourceValues: Source[] = ["microphone", "sine"];
export const sourceLabels: SourceLabels = {
	microphone: "Áudio do Microfone",
	sine: "Oscilador"
};
export const sourceOptions: Option<Source>[] = sourceValues.map(x => ({ value: x, label: sourceLabels[x] }));