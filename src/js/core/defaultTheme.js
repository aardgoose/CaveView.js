
const defaultTheme = {
	fieldOfView: 50,
	background: 'black',
	maxPolarAngle: 180,
	lighting: {
		azimuth: 315,
		inclination: 45
	},
	hud: {
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
		entrances: {
			text: 'white',
			marker: 'white'
		},
		junctions: {
			text: 'yellow',
			marker: 'yellow'
		},
		default: {
			text: 'white',
			marker: 'red'
		}
	},
	shading: {
		single: 'white',
		cursor: 'yellow',
		cursorBase: 'gray',
		unselected: 'gray',
		contours: {
			line: 0xe1bba2,
			line10: 0xf29d62,
			interval: 10,
			base: 'white'
		},
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
	}
};

export { defaultTheme };