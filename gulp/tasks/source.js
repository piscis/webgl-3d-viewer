import gulpMain    from 'gulp';
import gulpHelp    from 'gulp-help';
import babel       from 'gulp-babel';
import concat      from 'gulp-concat';
import sourcemaps  from 'gulp-sourcemaps';
import del         from 'del';
import runSequence from 'run-sequence';
import gutil       from 'gulp-util';
import webpack     from 'webpack';

import browserify  from 'browserify';
import babelify    from 'babelify';
import source      from 'vinyl-source-stream';

var gulp = gulpHelp(gulpMain);

gulp.task('source:es66', false, (cb)=>{

  let files = [
    'src/viewer/*.js',
    'src/viewer/**/*.js'
  ];

  return browserify({entries: 'src/viewer/Main.js', 'standalone': 'All3DP.ModelViewer', extensions: ['.js'], debug: true})
    .transform(babelify)
    .bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest('build'));

});


gulp.task("source:es6", function(callback) {

  webpack(require('../../webpack.config.js'), function(err, stats) {

    if(err) throw new gutil.PluginError("webpack", err);
      gutil.log("[webpack]", stats.toString({
    }));

    callback();
  });
});


gulp.task('source:static', false, (cb)=>{

  let files = [
    '!src/viewer/*.js',
    '!src/viewer/**/*.js',
    'src/**/*(*.js|*.html|*.stl|*.json|*.xml|*.png|*.jpg|*.svg|*.jpeg|*.gif|*.css)',
    'src/*(*.js|*.html|*.stl|*.json|*.xml|*.png|*.jpg|*.svg|*.jpeg|*.gif|*.css)'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('build/'));
});

gulp.task('source', false, (cb)=>{
  return runSequence(['source:es6','source:static'], cb);
});