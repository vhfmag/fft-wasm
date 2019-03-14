import * as React from "react";
import { ProcessorName, processors, processorOptions } from "../types/processor";
import { SelectField } from "../components/select";
import { Line } from "react-chartjs-2";
import { ChartDataMap, ChartData, chartDataOptions } from "../types/chartData";
import { Source, sourceOptions } from "../types/sources";
import { useMediaSource } from "../utils/audioStream";
import { useDuration, useConstructor } from "../utils/hooks";

const movingMeanSize = 100;

export const AudioDashboard = () => {
	const [processorName, setProcessorName] = React.useState<ProcessorName>("wasm");
	const [dataToPlot, setDataToPlot] = React.useState<ChartData>("fft");
	const [source, setSource] = React.useState<Source>("sine");
	const context = useConstructor(() => new AudioContext());
	const value = useMediaSource(context, source);

	const [ffted, meanDuration] = useDuration(
		() => {
			if (!value.value) {
				return null;
			}

			const processor = processors[processorName];
			return [...processor(value.value).map(x => x ** 2)];
		},
		movingMeanSize,
		[processorName, !!value.value],
	);

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
			<SelectField<Source>
				label="Fonte de áudio"
				value={source}
				setValue={setSource}
				options={sourceOptions}
			/>
			<br />
			<SelectField<ChartData>
				label="Dados a plotar"
				value={dataToPlot}
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
							// xAxis: {
                            //     type: "linear",
                            //     display: true,
                            //     gridLines: { display: false },
                            //     ticks: {
                            //         callback: (_: any, i: number, values: any[]) =>
                            //             `${(i * context.sampleRate) / values.length} Hz`,
                            //     },
                            // },
							yAxes: [
								{
									type: "linear",
									display: true,
									gridLines: { display: false },
									scaleLabel: { display: false },
									ticks: {
										display: false,
										...(dataToPlot === "fft"
											? {
													beginAtZero: true,
													max: Math.max(...data),
											  }
											: {
													max: 1,
													min: -1,
											  }),
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
					}}
				/>
			</div>
		</div>
	);
};
