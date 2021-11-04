diffuseColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) );
diffuseColor.a = opacity;