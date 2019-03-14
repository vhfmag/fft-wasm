import * as React from "react";
import { render } from "react-dom";
import { fromEvent, of, from } from "rxjs";
import { flatMap, bufferCount, catchError, map, tap } from "rxjs/operators";
import { useObservable } from "rxjs-hooks";
import { ProcessorName, processors, processorOptions } from "./types/processor";
import { SelectField } from "./select";
import { Line } from "react-chartjs-2";
import { ChartDataMap, ChartData, chartDataOptions } from "./types/chartData";
import { Source, sourceOptions } from "./types/sources";

const updateFreq = 2048;
const processorSampleRate = 2048;
const bufferSize = 2048 * 2;

function mediaStreamToObservable(audioInput: AudioNode, context: AudioContext) {
	const recorder = context.createScriptProcessor(processorSampleRate, 2, 1);

	const stream = fromEvent<AudioProcessingEvent>(recorder, "audioprocess").pipe(
		flatMap(ev => ev.inputBuffer.getChannelData(0)),
		// tap(v => console.log(v)),
	);

	audioInput.connect(recorder);
	recorder.connect(context.destination);

	return stream;
}

const movingMeanSize = 100;

type StreamState = "prune" | "active" | "failed";
type BaseStreamValue<
	State extends StreamState,
	Value extends number[] | null = number[] | null,
	Error extends any = any
> = { state: State; value: Value; error: Error };
type StreamValue =
	| BaseStreamValue<"active", number[], null>
	| BaseStreamValue<"failed", null>
	| BaseStreamValue<"prune", null, null>;

const useMediaSource = (source: Source) => {
	const contextRef = React.useRef<AudioContext>();

	if (!contextRef.current) {
		contextRef.current = new AudioContext();
	}

	const context = contextRef.current;
	const userMediaRef = React.useRef<MediaStreamAudioSourceNode>();

	return useObservable<StreamValue, [Source]>(
		input$ => {
			return input$.pipe(
				flatMap(([source]) => {
					if (source === "sine") {
						const oscillator = context.createOscillator();
						oscillator.type = "square";
						oscillator.frequency.setValueAtTime(
							context.sampleRate / 4,
							context.currentTime,
						);
						oscillator.start();
						
						return of(oscillator);
					} else if (source === "microphone") {
						if (userMediaRef.current) {
							return of(userMediaRef.current);
						} else {
							return from(navigator.mediaDevices.getUserMedia({ audio: true })).pipe(
								map(userMedia => context.createMediaStreamSource(userMedia)),
								tap(e => (userMediaRef.current = e)),
							);
						}
					} else {
						throw new Error(`Invalid source value: '${source}'`)
					}
				}),
				flatMap(v => mediaStreamToObservable(v, context)),
				bufferCount(bufferSize, updateFreq),
				map(value => ({
					state: "active" as const,
					error: null,
					value,
				})),
				catchError(error => {
					console.error(error);
					return of({ state: "failed" as const, error, value: null });
				}),
			);
		},
		{
			state: "prune",
			error: null,
			value: null,
		},
		[source],
	);
};

function useDuration<T>(fn: () => T, samples: number, deps: any[] = []): [T, number] {
	const lastDurations = React.useRef<number[]>([]);

	React.useEffect(() => {
		lastDurations.current.length = 0;
	}, deps);

	const before = performance.now();
	const value = fn();

	lastDurations.current.unshift(performance.now() - before);
	if (lastDurations.current.length > samples) {
		lastDurations.current.length = samples;
	}
	
	return [value, lastDurations.current.reduce((a, b) => a + b) / lastDurations.current.length];
}

const SoundApp = () => {
	const [processorName, setProcessorName] = React.useState<ProcessorName>("wasm");
	const [dataToPlot, setDataToPlot] = React.useState<ChartData>("fft");
	const [source, setSource] = React.useState<Source>("sine");
	const value = useMediaSource(source);

	const [ffted, meanDuration] = useDuration(() => {
		if (!value.value) {
			return;
		}

		const processor = processors[processorName];
		return [...processor(value.value).map(x => x ** 2)]
	}, movingMeanSize, [processorName, !!value.value]);

	if (value.state === "prune") {
		return <h1>Pls let me</h1>;
	} else if (value.state === "failed") {
		return (
			<div>
				<h1>Whoops</h1>
				<p>
					{value.error instanceof Error
						? value.error.message
						: JSON.stringify(value.error)}
				</p>
			</div>
		);
	}

	if (!ffted) {
		throw new Error("Invalid state: stream is active, but FFT is nullish");
	}

	const dataMap: ChartDataMap = { fft: ffted, raw: value.value };
	const data = dataMap[dataToPlot];

	return (
		<div>
			Oh hai
			<br />
			<SelectField<Source> label="Fonte de áudio" value={source} setValue={setSource} options={sourceOptions} />
			<br />
			<SelectField<ChartData>
				label="Dados a plotar" value={dataToPlot}
				setValue={setDataToPlot}
				options={chartDataOptions}
			/>
			<br />
			<SelectField<ProcessorName>
				label="Processar com"
				value={processorName}
				setValue={setProcessorName}
				options={processorOptions}
			/>
			<br />
			<p>{meanDuration} milliseconds per run</p>
			<br />
			<div style={{ width: "100vw", maxWidth: "500px" }}>
				<Line
					options={{
						animation: {
							duration: 100,
						},
						scales: {
							yAxes: [
								{
									type: "linear",
									display: true,
									gridLines: { display: false },
									ticks:
										dataToPlot === "fft"
											? {
													beginAtZero: true,
													max: Math.max(...data),
											  }
											: {
													max: 1,
													min: -1,
											  },
									id: "y-axis",
								},
							],
						},
					}}
					data={{
						datasets: [
							{
								label: "FFT",
								data: data,
								yAxisID: "y-axis",
							},
						],
						// labels: Array.from(new Array(10))
						// 	.map((_, i) => (i * sampleRate) / ffted.length)
						// 	.map((hz): string => `${hz} Hz`),
					}}
				/>
			</div>
		</div>
	);
};

const App = () => {
	const [clicked, setClicked] = React.useState(false);

	if (clicked) return <SoundApp />;
	else
		return (
			<button autoFocus onClick={() => setClicked(true)}>
				Click me
			</button>
		);
};

render(<App />, document.querySelector("#root"));
