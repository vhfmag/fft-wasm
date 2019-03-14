import * as React from "react";

export interface Option<T extends React.Key> {
	value: T;
	label: string;
}

export interface SelectProps<T extends React.Key> {
	value: T;
	setValue(v: T): void;
	options: Option<T>[];
}

export function Select<T extends React.Key>({ value, setValue, options }: SelectProps<T>) {
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

export interface SelectFieldProps<T extends React.Key> extends SelectProps<T> {
	label?: React.ReactNode;
}

export function SelectField<T extends React.Key>({ label, ...selectProps }: SelectFieldProps<T>) {
	return (
		<label className="Select-field">
			{label && <div className="Select-label">{label}</div>}
			<Select<T> {...selectProps} />
		</label>
	);
}
