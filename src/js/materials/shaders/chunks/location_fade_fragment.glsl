	#ifdef CV_LOCATION

		gl_FragColor.a = 1.0 - smoothstep( distanceFadeMin, distanceFadeMax, distance( cameraLocation, vPosition ) );

	#endif