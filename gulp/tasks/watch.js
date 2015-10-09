import gulpMain   from 'gulp';
import gulpHelp   from 'gulp-help';

var gulp = gulpHelp(gulpMain);

gulp.task('watch', false, (cb)=>{

  gulp.watch('src/**/*.*', ['source']);
  gulp.watch('src/*.*',    ['source']);
  cb()
});