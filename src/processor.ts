import { Option } from "./select";
import WasmFFT from "../crate/Cargo.toml";
import { fft } from "./fft";

export type Processor = (ns: number[] | Float64Array) => Float64Array;

const normFFT: Processor = ns => new Float64Array(fft(ns).map(c => c.abs()));

export const processors = {
	wasm: WasmFFT.fft as Processor,
	js: normFFT,
};

export type ProcessorName = keyof typeof processors;

export const processorNames: ProcessorName[] = ["js", "wasm"];

export const processorLabels: Record<ProcessorName, string> = {
	wasm: "WebAssembly",
	js: "Javascript",
};

export const processorOptions: Option<ProcessorName>[] = processorNames.map(n => ({ value: n, label: processorLabels[n] }));