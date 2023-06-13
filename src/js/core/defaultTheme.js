const defaultTheme = {
	fieldOfView: 50,
	background: 'black',
	sky: 0x106f8d,
	maxPolarAngle: 180,
	saturatedGradient: false,
	lighting: {
		azimuth: 315,
		inclination: 45
	},
	entrance_dot_size: 5,
	hud: {
		font: 'normal Arial, sans-serif',
		text: 'white',
		progress: 'green',
		progressBackground: 'dimgray',
		bezel: 'gray',
		widgetSize: 40,
		scale: {
			bar1: 'white',
			bar2: 'red',
		},
		compass: {
			top1: 0xb03a14,
			top2: 0x1ab4e5,
			bottom1: 0x581d0a,
			bottom2: 0x0c536a
		},
		ahi: {
			sky: 0x106f8d,
			earth: 0x802100,
			bar: 'yellow',
			marks: 'white'
		},
		cursor: 'yellow'
	},
	box: {
		bounding: 'white',
		select: 'blue',
		highlight: 'red'
	},
	routes: {
		active: 'yellow',
		adjacent: 'red',
		default: 'gray'
	},
	stations: {
		font: 'normal Arial, sans-serif',
		default: {
			text: 'white',
			background: 'rgba( 0.0, 0.0, 0.0, 0.75 ) ',
			font: 'normal Arial, sans-serif',
			marker: 'red'
		},
		entrances: {
			text: 'white',
			background: 'darkred',
			marker: 'white',
			angle: 45,
		},
		junctions: {
			text: 'yellow',
			font: 'normal Arial, sans-serif',
			marker: 'yellow'
		},
		linked: {
			text: 'cyan',
			font: 'normal Arial, sans-serif',
			marker: 'cyan'
		}
	},
	shading: {
		single: 'red',
		surface: 'yellow',
		duplicate: 'white',
		cursor: 'yellow',
		cursorBase: 'gray',
		unselected: 'gray',
		contours: {
			line: 0xe1bba2,
			line10: 'green',
			interval: 10,
			base: 'white'
		},
		ringColor: 'red',
		/*
		hypsometric: {
			min: 0,
			max: 400
		},
		*/
		unconnected: 'gray'
	},
	popup: {
		text: 'white',
		border: 'white',
		background: 0x111111
	},
	grid: {
		base: 'gray'
	}
};

export { defaultTheme };