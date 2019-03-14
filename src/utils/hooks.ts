import * as React from "react";

export function useDuration<T>(fn: () => T, samples: number, deps: any[] = []): [T, number] {
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

export function useConstructor<T>(fn: () => T) {
	const contextRef = React.useRef<T>();

	if (!contextRef.current) {
		contextRef.current = fn();
	}

	return contextRef.current;
}