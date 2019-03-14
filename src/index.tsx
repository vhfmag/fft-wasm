import * as React from "react";
import { render } from "react-dom";
import { AudioDashboard } from "./components/audioDashboard";

const App = () => {
	const [clicked, setClicked] = React.useState(false);

	if (clicked) return <AudioDashboard />;
	else
		return (
			<button autoFocus onClick={() => setClicked(true)}>
				Click me
			</button>
		);
};

render(<App />, document.querySelector("#root"));
