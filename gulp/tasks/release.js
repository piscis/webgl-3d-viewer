import gulpMain from 'gulp';
import gulpHelp from 'gulp-help';
import bump from 'gulp-bump';
import runSequence from 'run-sequence';
import source from 'vinyl-source-stream';
import uglify from 'gulp-uglify';

var gulp = gulpHelp(gulpMain);

gulp.task('release:viewer', false, () => {

  var files = [
    'build/viewer/**/*.*',
    'build/viewer/*.*'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('dist/viewer'));
})

gulp.task('release:compress', false, () => {

  return gulp.src('build/example/main.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/example'));
});

gulp.task('release:example', false, () => {

  var files = [
    'build/example/**/*.*',
    'build/example/*.*',
    '!build/example/main.js'
  ];

  return gulp.src(files)
    .pipe(gulp.dest('dist/example'));
});


gulp.task('release:bump-version', false, function(){
  gulp.src('./package.json')
    .pipe(bump({type:'patch'}))
    .pipe(gulp.dest('./'));
});

gulp.task('release:build', false, (cb)=>{
  return runSequence(['release:compress','release:viewer','release:example'], 'release:bump-version', cb);
});