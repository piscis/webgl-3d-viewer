import gulpMain    from 'gulp';
import gulpHelp    from 'gulp-help';
import runSequence from 'run-sequence';
import source      from 'vinyl-source-stream';
import uglify      from 'gulp-uglify';

var gulp = gulpHelp(gulpMain);

gulp.task('release:compress', false, () => {
  return gulp.src('build/viewer/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/viewer'));
});

gulp.task('release:example', false, () => {

  var files = [
    'build/example/**/*.*',
    'build/example/*.*'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('dist/example'));
});

gulp.task('release:build', false, (cb)=>{
  return runSequence(['release:compress','release:example'], cb);
});