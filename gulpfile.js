var gulp    = require( 'gulp' );
var uglify  = require( 'gulp-uglify' );
var concat  = require( 'gulp-concat' );
var pump    = require( 'pump' );
var connect = require( 'gulp-connect' );
var bake    = require( 'gulp-bake' );
var rename  = require( 'gulp-rename' );
var replace = require( 'gulp-replace' );

gulp.task( 'buildviewer', function ( cb ) {

	pump( [
 		gulp.src( [ 'src/js/**/*.js', '!src/js/workers/*.js' ] ),
		concat( 'CaveView.js' ),
		gulp.dest( 'build/CaveView/js/uncompressed' ),
//		uglify(),
		gulp.dest( 'build/CaveView/js' )
   		], cb
	);

} );

gulp.task( 'buildworkers', function ( cb ) {

	pump( [
		gulp.src( 'src/js/workers/*.js' ),
//    uglify(),
		gulp.dest( 'build/CaveView/js/workers' )
		], cb
	);

} );

gulp.task( 'build', [ 'buildviewer', 'buildworkers', 'copycss', 'copyimages', 'copyhtml', 'copy3rdParty' ] );

gulp.task( 'copyhtml', function ( cb ) {

	pump( [
		gulp.src( 'src/html/*.html' ),
		gulp.dest( 'build' )
		], cb
	);

} );

gulp.task( 'copycss', function ( cb ) {

	pump( [
		gulp.src( 'src/css/*.css' ),
		gulp.dest( 'build/CaveView/css' )
		], cb
	);

} );

gulp.task( 'copyimages', function ( cb ) {

	pump( [
		gulp.src( 'src/images/*.*' ),
		gulp.dest( 'build/CaveView/images' )
		], cb
	);

} );

gulp.task( 'copy3rdParty', function ( cb ) {

	pump( [
		gulp.src( '3rdParty/*.*' ),
		gulp.dest( 'build/CaveView/lib' )
		], cb
	);

} );

gulp.task( 'buildshaders', function ( cb ) {

	pump( [
		gulp.src( 'src/js/shaders/*.glsl' ),
		replace( /[\r\n]+/g, "\\n" ),
		rename( { extname: ".txt" } ),
		gulp.dest( 'src/js/shaders' )
		], cb
	);

} );

gulp.task( 'buildshaderlib', [ 'buildshaders' ], function ( cb ) {

	pump( [
		gulp.src( 'src/js/shaders/shaderlib.tpl' ),
		bake( {
			"<testVertexShader>":        "src/js/shaders/testVertexShader.txt",
			"<testFragmentShader>":      "src/js/shaders/testFragmentShader.txt",
			"<heightVertexShader>":      "src/js/shaders/heightVertexShader.txt",
			"<heightFragmentShader>":    "src/js/shaders/heightFragmentShader.txt",
			"<cursorVertexShader>":      "src/js/shaders/cursorVertexShader.txt",
			"<cursorFragmentShader>":    "src/js/shaders/cursorFragmentShader.txt",
			"<depthMapVertexShader>":    "src/js/shaders/depthMapVertexShader.txt",
			"<depthMapFragmentShader>":  "src/js/shaders/depthMapFragmentShader.txt",
			"<depthVertexShader>":       "src/js/shaders/depthVertexShader.txt",
			"<depthFragmentShader>":     "src/js/shaders/depthFragmentShader.txt",
			"<pwVertexShader>":          "src/js/shaders/pwVertexShader.txt",
			"<pwFragmentShader>":        "src/js/shaders/pwFragmentShader.txt"
		} ),
		rename( { extname: ".js" } ),
		gulp.dest( 'src/js/shaders' )
		], cb
	);

} );


gulp.task( 'watcher1', function (cb) {

  gulp.watch( [ 'src/js/**/*.js', '!src/js/workers/*.js' ], [ 'buildviewer', 'watcher1' ] )  

} );

gulp.task( 'watcher2', function (cb) {

	gulp.watch( 'src/js/workers/*.js', [ 'buildworkers' ] )

} );

gulp.task( 'watcher3', function (cb) {

	gulp.watch( [ 'src/js/shaders/*.glsl', 'src/js/shaderlib.tpl' ], [ 'buildshaderlib' ] )

} );

 
gulp.task('runserver', function() {
 
	connect.server( { root: 'build' } );

});

gulp.task( 'default', [ 'runserver', 'watcher1', 'watcher2' ] );
 