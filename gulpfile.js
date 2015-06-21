var typescript = require('typescript');
var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');

var PATHS = {
	src: {
		ts: 'src/**/*.ts'
	},
	dest: {
		dist: 'dist'
	}
};

var getRunScript = function(testName, next) {
	return gulp.src('tests/' + testName + '.js')
        .pipe(mocha())
        .once('error', function () {
			if (typeof next === 'function') {
				next();
			}
        })
        .once('end', function () {
			if (typeof next === 'function') {
				next();
			}
        })
};

gulp.task('typescript', function(){
	return gulp.src(PATHS.src.ts).pipe(ts({
		typescript: typescript,
		target: 'ES5',
		module: 'commonjs',
		declarationFiles: true
	})).js.pipe(gulp.dest(PATHS.dest.dist));
});

gulp.task('test', ['typescript'], function(){
	getRunScript('basic');
});

gulp.task('build', ['test'], function(){
	
});