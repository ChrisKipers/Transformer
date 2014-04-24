var gulp = require('gulp');
var compass = require('gulp-compass');
var coffee = require('gulp-coffee');
var browserify = require('gulp-browserify');
var clean = require('gulp-clean');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('sass', function() {
	return gulp.src('sass/*.scss')
		.pipe(compass({
			config: 'config.rb',
			css: 'stylesheets',
			sass: 'sass'
		}));
});

gulp.task('scripts', function() {
	return gulp.src('src/*.coffee')
		.pipe(coffee())
		.pipe(gulp.dest('temp'))
		.pipe(browserify())
		.pipe(gulp.dest('compiled'))
});

gulp.task('clean', function() {
	return gulp.src(['temp', 'compiled', 'stylesheets'], {read: false})
		.pipe(clean());
});

gulp.task('clean-all', function() {
	return gulp.src(['temp', 'compiled', 'stylesheets', 'plugins'], {read: false})
		.pipe(clean());
});



gulp.task('package', ['scripts', 'sass'], function() {
	gulp.src('compiled/angular.js')
		.pipe(rename('transformer.js'))
		.pipe(gulp.dest('plugins/angular/'))
		.pipe(uglify())
		.pipe(rename('transformer.min.js'))
		.pipe(gulp.dest('plugins/angular/'));
	gulp.src('stylesheets/transformer.css')
		.pipe(gulp.dest('plugins/angular/'));
	gulp.src('compiled/jquery.js')
		.pipe(rename('transformer.js'))
		.pipe(gulp.dest('plugins/jquery/'))
		.pipe(uglify())
		.pipe(rename('transformer.min.js'))
		.pipe(gulp.dest('plugins/jquery/'));
	gulp.src('stylesheets/transformer.css')
		.pipe(gulp.dest('plugins/jquery/'));
	gulp.src('compiled/vanella.js')
		.pipe(rename('transformer.js'))
		.pipe(gulp.dest('plugins/javascript/'))
		.pipe(uglify())
		.pipe(rename('transformer.min.js'))
		.pipe(gulp.dest('plugins/javascript/'));
	gulp.src('stylesheets/transformer.css')
		.pipe(gulp.dest('plugins/javascript/'));
});

gulp.task('build', ['package'], function() {
	gulp.start('clean')
});

//gulp.task('default', ['sass', 'scripts', 'clean']);
gulp.task('default', function() {
	var tasks = ['build'];
	gulp.watch('sass/*.scss', tasks);
	gulp.watch('src/*.coffee', tasks);
});
