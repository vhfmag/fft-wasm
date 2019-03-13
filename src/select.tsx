import * as React from "react";

export interface Option<T extends React.Key> {
	value: T;
	label: string;
}

export function Select<T extends React.Key>({
	value,
	setValue,
	options,
}: {
	value: T;
	setValue(v: T): void;
	options: Option<T>[];
}) {
	return (
		<select value={value} onChange={ev => setValue(ev.currentTarget.value as T)}>
			{options.map(o => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	);
}