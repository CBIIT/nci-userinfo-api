'use strict';
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var eslint = require('gulp-eslint');
var nodemon = require('gulp-nodemon');
var jsFiles = ['*.js', 'src/**/*.js'];

gulp.task('style', function () {
    gulp.src(jsFiles)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', ['style'], function () {
    return gulp.src('src/test/*.js')
        .pipe(mocha());
});

gulp.task('serve', ['style'], function () {
    var options = {
        script: 'app.js',
        delayTime: 1,
        env: {
            'PORT': 8070,
            'SSL_PORT': 7443
        },
        watch: jsFiles
    };

    return nodemon(options)
        .on('restart', function () {
            console.log('Restarting...');
        });
});