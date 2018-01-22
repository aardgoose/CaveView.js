const lang_en = {
	settings: {
		survey: {
			header: 'Survey',
			caption: 'File'
		},
		view: {
			header: 'View',
			camera: {
				caption: 'Camera type',
				orthographic: 'Orthographic',
				perspective: 'Perspective'
			},
			viewpoints: {
				caption: 'Viewpoint',
				none: '<select viewpoint>',
				plan: 'Plan',
				elevation_n: 'N Elevation',
				elevation_s: 'S Elevation',
				elevation_e: 'E Elevation',
				elevation_w: 'W Elevation'
			},
			vertical_scaling: 'Vertical Scaling',
			autorotate: 'Auto Rotate',
			rotation_speed: 'Rotation Speed'
		},
		shading: {
			header: 'Shading',
			caption: 'Underground legs',
			height: 'by height',
			length: 'by leg length',
			inclination: 'by leg inclination',
			height_cursor: 'height cursor',
			fixed: 'fixed',
			survey: 'survey',
			route: 'route',
			depth: 'depth',
			depth_cursor: 'depth cursor'
		},
		visibility: {
			header: 'Visibility',
			entrances: 'Entrances',
			stations : 'Stations',
			labels: 'Station Labels',
			walls: 'Walls (LRUD)',
			scraps: 'Scraps',
			splays: 'Splay Legs',
			traces: 'Dye Traces',
			box: 'Bounding box',
			hud: 'Indicators'
		}
	},
	surface: {
		surface: {
			header: 'Surface Features',
			legs: 'Surface Legs',
			shading: {
				caption: 'Shading',
				height: 'by height',
				inclination: 'by inclination',
				height_cursor: 'height cursor',
				fixed: 'fixed'
			}
		},
		terrain: {
			header: 'Terrain',
			terrain: 'Terrain visible',
			shading: {
				caption: 'Shading',
				relief: 'relief shading',
				height: 'by height',
				overlay: 'map overlay'
			},
			overlay: {
				caption: 'Overlay'
			},
			opacity: 'Opacity',
			datum_shift: 'Vertical datum shift'
		}
	},
	routes: {
		routes: {
			header: 'Routes',
			edit: 'Edit routes',
			current: 'Current route',
			save: 'Save',
			new: 'New route',
			add: 'Add',
			download: 'Download'
		}
	},
	help: {
		header: 'Help - key commands',
		shading: {
			header: 'Shading',
			height: 'height',
			inclination: 'leg inclination',
			length: 'leg length',
			height_cursor: 'height cursor',
			single: 'single colour',
			survey: 'survey section',
			route: 'route',
			depth: 'depth below surface',
			depth_cursor: 'depth_cursor',
			cursor_up: 'move cursor up',
			cursor_down: 'move cursor down'
		},
		view: {
			header: 'View',
			full_screen: 'toggle full screen',
			orthogonal: 'orthogonal view',
			perspective: 'perspective view',
			reset: 'reset to plan view',
			center: 'center on selected feature',
			next: 'next cave'
		},
		visibility: {
			header: 'Visibility',
			scraps: 'scraps on/off [lox only]',
			station_labels: 'station labels on/off',
			entrance_labels: 'entrancel abels on/off',
			splays: 'splay legs on/off',
			surface: 'surface legs on/off',
			terrain: 'terrain on/off',
			walls: 'LRUD walls on/off',
			stations: 'station markers on/off',
			opacity_down: 'decrease terrain opacity',
			opacity_up: 'increase terrain opacity'
		},
		selection: {
			header: 'Selection',
			remove: 'remove all except selected section'
		}
	},
	hud: {
		height: 'height',
		leg_length: 'leg length',
		depth: 'depth',
		above_datum: 'height above datum',
		below_surface: 'depth below surface',
		inclination: 'inclination'
	}
};

export { lang_en };
