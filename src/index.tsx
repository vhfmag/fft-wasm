import * as React from "react";
import { render } from "react-dom";
import { fromEvent, from, of } from "rxjs";
import { flatMap, takeUntil, bufferCount, catchError, map } from "rxjs/operators";
import { useObservable } from "rxjs-hooks";
import { ProcessorName, processors, processorOptions } from "./processor";
import { Select } from "./select";
import { Line } from "react-chartjs-2";

const updateFreq = 1024;
const sampleRate = 256;
const bufferSize = 4096;

function mediaStreamToObservable(e: MediaStream) {
	const context = new AudioContext();
	const audioInput = context.createMediaStreamSource(e);

	const recorder = context.createScriptProcessor(sampleRate, 2, 1);
	const audioTrack = e.getTracks()[0];

	const doneStream = fromEvent(audioTrack, "ended");
	const stream = fromEvent<AudioProcessingEvent>(recorder, "audioprocess").pipe(
		flatMap(ev => ev.inputBuffer.getChannelData(0)),
		bufferCount(bufferSize, updateFreq),
		takeUntil(doneStream),
	);

	audioInput.connect(recorder);
	recorder.connect(context.destination);

	return stream;
}

const movingMeanSize = 100;

const App = () => {
	const [processorName, setProcessorName] = React.useState<ProcessorName>("wasm");
	const lastDurations = React.useRef<number[]>([]);

	let value = useObservable(() =>
		from(navigator.mediaDevices.getUserMedia({ audio: true })).pipe(
			flatMap(mediaStreamToObservable),
			map(value => ({ active: true, failed: false as const, error: null, value })),
			catchError(error => {
				console.error(error);
				return of({ active: true, failed: true as const, error, value: null });
			}),
		),
	);

	if (!value) {
		return <h1>Pls let me</h1>;
	} else if (value.failed) {
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

	const processor = processors[processorName];
	const before = performance.now();
	const ffted = processor(value.value);

	lastDurations.current.unshift(performance.now() - before);
	if (lastDurations.current.length > movingMeanSize) {
		lastDurations.current.length = movingMeanSize;
	}

	const onChange = (v: ProcessorName) => {
		setProcessorName(v);
		lastDurations.current = [];
	};

	const length = lastDurations.current.length;

	return (
		<div>
			Oh hai
			<br />
			<Select<ProcessorName>
				value={processorName}
				setValue={onChange}
				options={processorOptions}
			/>
			<br />
			{`${lastDurations.current.reduce((a, b) => a + b) / length} milliseconds per run`}
			<br />
			<Line
				options={{
					scales: {
						yAxes: [
							{
								type: "linear",
								display: true,
								gridLines: { display: false },
								ticks: {
									beginAtZero: true,
									max: 5000,
									min: 0,
								},
								id: "y-axis",
							},
						],
					},
				}}
				data={{
					datasets: [
						{
							fill: false,
							label: "FFT",
							data: [...ffted].map(x => x ** 2),
							yAxisID: "y-axis",
						},
					],
				}}
			/>
		</div>
	);
};

render(<App />, document.querySelector("#root"));
