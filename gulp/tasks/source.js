import gulpMain    from 'gulp';
import gulpHelp    from 'gulp-help';
import concat      from 'gulp-concat';
import del         from 'del';
import runSequence from 'run-sequence';
import gutil       from 'gulp-util';
import babel       from 'gulp-babel';
import webpack     from 'webpack';

var gulp = gulpHelp(gulpMain);

gulp.task('source:webpack', false, function(callback) {

  var config = {
    entry: './src/example/main.js',
    output: {
      path: __dirname+'/../../build/example',
      filename: 'main.js'
    },
    module: {
      loaders: [
        {
          test: /\.js?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel',
          query: {
            optional: ['runtime'],
            stage: 0
          }
        }
      ]
    }
  };

  webpack(config, function(err, stats) {

    if(err) throw new gutil.PluginError('webpack', err);

    gutil.log('[webpack]', stats.toString({}));

    callback();
  });
});

gulp.task('source:es6', false, function() {

  var files = [
    'src/viewer/**/*.*',
    'src/viewer/*.*'
  ];

  return gulp.src(files)
    .pipe(babel())
    .pipe(gulp.dest('build/viewer'));
});


gulp.task('source:static', false, ()=>{

  let files = [
    '!src/viewer/*.js',
    '!src/viewer/**/*.js',
    '!src/example/main.js',
    'src/**/*(*.js|*.html|*.stl|*.json|*.xml|*.png|*.jpg|*.svg|*.jpeg|*.gif|*.css)',
    'src/*(*.js|*.html|*.stl|*.json|*.xml|*.png|*.jpg|*.svg|*.jpeg|*.gif|*.css)'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('build/'));
});

gulp.task('source', false, (cb)=>{
  return runSequence(['source:es6','source:webpack','source:static'], cb);
});