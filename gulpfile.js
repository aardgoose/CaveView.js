var gulp    = require( 'gulp' );
var uglify  = require( 'gulp-uglify' );
var concat  = require( 'gulp-concat' );
var pump    = require( 'pump' );
var connect = require( 'gulp-connect' );

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

//gulp.task( 'default', [ 'runserver', 'watcher1', 'watcher2' ] );
 gulp.task( 'default', [ 'runserver' ] );
