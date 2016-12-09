
var gulp = require('gulp');

// 引入组件
var path          = require('path'), // node自带组件
    fse           = require('fs-extra'), // 通过npm下载
    sass          = require('gulp-sass'),
    autoprefixer  = require('gulp-autoprefixer'),
    merge         = require('merge-stream'),
    concat        = require('gulp-concat'),
    clean         = require('gulp-clean');

// 获取当前文件路径
var PWD = process.env.PWD || process.cwd(); // 兼容windows

//===================
//   文件初始化
//===================

gulp.task('init', function() {

    var dirs = ['dist', 'dist/css','dist/html','dist/img', 'dist/js', 'src', 'src/sass', 'src/js', 'src/img', 'src/pic', 'src/sprite', 'psd'];

    dirs.forEach(function(item, index) {
        // 使用mkdirSync方法新建文件夹
        fse.mkdirSync(path.join(PWD + '/' + item));
    })

    // 往index里写入的基本内容
    var template = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no"/><title></title><meta name="apple-touch-fullscreen" content="yes" /><meta name="format-detection" content="telephone=no" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black" /></head><body></body></html>';

    fse.writeFileSync(path.join(PWD + '/dist/html/index.html'), template);
    fse.writeFileSync(path.join(PWD + '/src/sass/style.scss'), '@charset "utf-8";');
})

//===================
//   编译sass
//===================

gulp.task('sass', function () {
  return gulp
    // Find all `.scss` files from the `src/sass` folder
    .src('src/sass/**/*.scss')
    .pipe(concat('style.css'))
    // Run Sass on those files base on some options
    .pipe(sass({
        errLogToConsole: true,
        outputStyle: 'compressed'
    }).on('error', sass.logError))
    // Write the resulting CSS in the output folder
    .pipe(gulp.dest('dist/css'));
});

//===================
//   autoprefixer
//===================

gulp.task('autoprefixer', function () {
  return gulp
    .src('dist/css/**/*.css')
    .pipe(autoprefixer({
        browsers: ['ios 5','android 2.3'],
        cascade: false
    }))
    .pipe(gulp.dest('dist/css'));
});



//===================
//   生成雪碧图
//===================

var spritesmith = require('gulp.spritesmith-multi')

gulp.task('sprite', ['resizeImg'], function () {

    var spriteData = gulp.src('src/sprite/**/*.png')
      .pipe(spritesmith({
          spritesmith: function (options, sprite) {
            options.cssName = sprite + '.scss';
            options.cssSpritesheetName = sprite;
          }
        }));

    var imgStream = spriteData.img
      .pipe(gulp.dest('dist/img'))

    var cssStream = spriteData.css
      // .pipe(concat('sprite.scss'))
      .pipe(gulp.dest('src/sass'))

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream)
})

//===================
//   修改2x图尺寸
//===================

var gm = require('gulp-gm');

// Define our tasks
gulp.task('resizeImg', function resizeImages () {
  return gulp.src('src/sprite/**/*@2x.png')
  .pipe(gm(function (gmfile, done) {

      gmfile.size(function (err, size) {
        var wid = size.width + size.width%2,
            hei = size.height + size.height%2;
          done(null, gmfile.resize(wid, hei, "!"));
        });
      },
        {
          imageMagick: true
        }
      ))
    .pipe(gulp.dest('src/sprite/'));
});

//=======================
//     清除不必要文件
//=======================
gulp.task('clean', function() {
  gulp.src('dist/img/*@2x.png')
    .on('data',function(file){
    var cFile = file.history[0].substring(file.history[0].lastIndexOf("\\")+1,file.history[0].lastIndexOf("@2x"));
    if(cFile) {
      return gulp.src('dist/img/'+cFile+'.png', {read: false})
                 .pipe(clean());
    }
  });
})



//=======================
//     服务器 + 监听
//=======================
var browserSync = require('browser-sync').create();

gulp.task('default', function() {
    // 监听重载文件
    var files = [
      'dist/html/**/*.html',
      'dist/css/**/*.css',
      'src/js/**/*.js'
    ]
    browserSync.init(files, {
      server: {
            baseDir: "./",
            directory: true
        },
      open: 'external',
      startPath: "dist/html/"
    });
    // 监听编译文件
    gulp.watch("dist/html/**/*.html").on('change', browserSync.reload);
    gulp.watch("src/sass/**/*.scss", ['sass']);
    gulp.watch("src/sprite/**/*.png", ['sprite','clean']);
    gulp.watch("dist/css/**/*.css", ['autoprefixer']);

});
