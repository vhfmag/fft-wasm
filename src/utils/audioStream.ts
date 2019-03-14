import * as React from "react";
import { Source } from "../types/sources";
import { useObservable } from "rxjs-hooks";
import { flatMap, bufferCount, map, tap, catchError } from "rxjs/operators";
import { fromEvent, of, from } from "rxjs";

type StreamState = "prune" | "active" | "failed";
type BaseStreamValue<
	State extends StreamState,
	Value extends number[] | null = number[] | null,
	Error extends any = any
> = { state: State; value: Value; error: Error };
export type StreamValue =
	| BaseStreamValue<"active", number[], null>
	| BaseStreamValue<"failed", null>
    | BaseStreamValue<"prune", null, null>;

const updateFreq = 2048;
const processorSampleRate = 2048;
const bufferSize = 2048 * 2;

function mediaStreamToObservable(audioInput: AudioNode, context: AudioContext) {
    const recorder = context.createScriptProcessor(processorSampleRate, 2, 1);

    const stream = fromEvent<AudioProcessingEvent>(recorder, "audioprocess").pipe(
        flatMap(ev => ev.inputBuffer.getChannelData(0)),
    );

    audioInput.connect(recorder);
    recorder.connect(context.destination);

    return stream;
}

export const useMediaSource = (context: AudioContext, source: Source) => {
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