'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'del']
});
var stylish = require('jshint-stylish');
var karmaServer  = require('karma').Server;
var connect = require('gulp-connect');
var modRewrite = require('connect-modrewrite');

/* build */

gulp.task('bump-version', function(){
  var bumpType = process.env.BUMP || 'patch'; // major.minor.patch

  gulp.src(['./bower.json', './package.json'])
  .pipe($.bump({ type: bumpType }))
  .pipe(gulp.dest('./'));
});

gulp.task('clean', function(cb) {
  $.del(['dist'], cb);
});

gulp.task('build', ['scripts', 'styles']);

gulp.task('release', ['build', 'bump-version'], function (done) {
  var pkg = require('./../bower.json'),
      v = 'v' + pkg.version,
      message = 'Release ' + v;

  gulp.src('./')
    .pipe($.git.add())
    .pipe($.git.commit(message))
    .pipe(gulp.dest('./'))
    .on('end', tag);

  function tag(){
    $.git.tag(v, message);

    gulp.src('changelog.sh', {read: false})
      .pipe($.shell(['bash <%= file.path %>']))
      .on('end', function() {
        gulp.src('./')
          .pipe($.git.add())
          .pipe($.git.commit('Update CHANGELOG.MD for ' + v + ' #nochangelog'))
          .pipe(gulp.dest('./'))
          .on('end', function() {
            $.git.push('origin', 'master', { args: '--tags' });
          });
      });

    done();
  }

});

/* scripts */

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish));
});

gulp.task('js', ['partials'], function() {
  return gulp.src(['src/**/*.js', '.tmp/inject/**/*js'])
    .pipe($.concat('angular-sequoia.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('partials', function () {
  return gulp.src(['src/**/*.html'])
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'ngSequoia'
    }))
    .pipe(gulp.dest('.tmp/inject/'));
});

gulp.task('scripts', ['lint', 'js'], function(){
  return gulp.src(['dist/*.js', '!dist/*.min.js'])
    .pipe($.stripDebug())
    .pipe($.uglify())
    .pipe($.rename({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('dist/'));
});

/* styles */

gulp.task('scss', function () {
  return gulp.src(['src/**/*.scss'])
    .pipe($.sass({style: 'expanded'}))
    .on('error', function handleError(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist/'));
});

gulp.task('styles', ['scss'], function(){
  return gulp.src(['dist/*.css', '!dist/*.min.css'])
    .pipe($.csso())
    .pipe($.rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest('dist/'));
});

/* tests */
gulp.task('watch-test', ['js', 'scss'], function(done) {
  new karmaServer({configFile: __dirname + '/../karma.conf.js', singleRun: false, autoWatch: true},done).start();
});

gulp.task('test', ['js', 'scss'], function(done) {
  new karmaServer({configFile: __dirname + '/../karma.conf.js', singleRun: true, autoWatch: false},done).start();
});

/* watch */
gulp.task('watch', ['js', 'scss'], function(){
  gulp.watch('examples/*.{js,html}', ['reload'])
  gulp.watch('src/**/*.{js,html}', ['lint', 'js', 'reload']);
  gulp.watch('src/**/*.scss', ['scss', 'reload']);
});


gulp.task('reload', function(){
  gulp.src('examples/*.{js,html}')
      .pipe(connect.reload());
});

gulp.task('webserver', [], function(){
  connect.server({
    port: 9001,
    livereload: true,
    // redirect / to /examples
    middleware: function() {
      return [
        modRewrite([
          '^/$ /examples/ [R]'
        ])
      ];
    }
  });
});

gulp.task('serve', ['webserver', 'watch']);

