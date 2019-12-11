const 
    bs            = require('browser-sync').create(),
    gulp          = require('gulp'),
    autoprefixer  = require('gulp-autoprefixer'),
    jshint        = require('gulp-jshint'),
    sass          = require('gulp-sass'),
    imagemin      = require('gulp-imagemin'),
    rename        = require('gulp-rename'),
    uglify        = require('gulp-uglify'),
    notify        = require('gulp-notify'),
    replace       = require('gulp-replace'),
    zip           = require('gulp-zip'),
    clean         = require('gulp-clean'),
    cleanCSS      = require('gulp-clean-css');
    details       = require('./project-details.json'),
    project       = details.project,
    version       = details.version,
    author        = details.author,
    company       = details.company,
    url           = details.url,
    email         = details.email,
    description   = details.description;
    schemes       = details.schemes;
    
const paths = {
  projectdetails: {
    src: './project-details.json'
  },
  fonts: {
    src: './src/fonts/*',
    dest: './dist/fonts/'
  },
  faFonts: {
    src: './node_modules/@fortawesome/fontawesome-free/webfonts/*',
    dest: './dist/webfonts/'
  },
  faCss: {
    src: './node_modules/@fortawesome/fontawesome-free/css/all.min.css',
    dest: './dist/css/'
  },
  slimMenu: {
    src: './src/assets/jquery.slimmenu.min.js',
    dest: './dist/js/'
  },
  normalize: {
    src: './node_modules/normalize.css/normalize.css',
    dest: './dist/css/'
  },
  bsJs: {
    src: './node_modules/bootstrap/dist/js/bootstrap.bundle.min.*',
    dest: './dist/js/'
  },
  images: {
    src: './src/images/**/*.{jpg,jpeg,png,gif,svg}',
    dest: './dist/images/'
  },
  styles: {
    src: './src/scss/**/*.scss',
    dest: './dist/css/'
  },
  themescheme: {
    src: './src/scss/themes/_themes.scss',
    dest: './dist/css/'
  },
  colorscheme: {
    src: './src/scss/variables/_colors.scss',
    dest: './dist/css/'
  },
  fontscheme: {
    src: './src/scss/variables/_type.scss',
    dest: './dist/css/'
  },
  scripts: {
    src: './src/js/*.js',
    dest: './dist/js/'
  },
  containers: {
    src: './containers/*',
    dest: '../../Containers/'+project+'/'
  },
  manifest: {
    src: './manifest.dnn',
    dest: './'
  },
  zipdist: {
    src: 'dist/**/*',
    zipfile: 'dist.zip',
    dest: './temp/'
  },
  zipcontainers: {
    src: './containers/**/*',
    zipfile: 'cont.zip',
    dest: './temp/'
  },
  zipelse: {
    src: ['./menus/**/*', './partials/*', '*.{ascx,xml,html,htm}'],
    zipfile: 'else.zip',
    dest: './temp/'
  },
  zippackage: {
    src: ['./temp/*.zip','*.{dnn,png,jpg,txt}', 'LICENSE'],
    zipfile: project+'\_'+version+'\_',
    dest: './build/'
  },
  cleanup: {
    src: './temp/'
  }
};
    

/*------------------------------------------------------*/
/* INIT TASKS ------------------------------------------*/
/*------------------------------------------------------*/
// Copy fonts from src/fonts to dist/fonts
function fontsInit() {
  return gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'fontsInit', sound: false}));
}

// Copy fontawesome-free fonts from node_modules to dist/fonts
function faFontsInit() {
  return gulp.src(paths.faFonts.src)
    .pipe(gulp.dest(paths.faFonts.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'faFontsInit', sound: false}));
}

// Copy fontawesome-free CSS from node_modules to dist/css/fontawesome-free
function faCssInit() {
  return gulp.src(paths.faCss.src)
    .pipe(gulp.dest(paths.faCss.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'faCssInit', sound: false}));
}

// Copy jquery.slimmenu.min.js from src/assets to dist/js
function slimMenuInit() {
  return gulp.src(paths.slimMenu.src)
    .pipe(gulp.dest(paths.slimMenu.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'slimMenuInit', sound: false}));
}

// Compile normalize.css from node_modules and copy to dist/js
function normalizeInit() {
  return gulp.src(paths.normalize.src, { sourcemaps: true })
  .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
  .pipe(cleanCSS())
  .pipe(rename({suffix: '.min'}))
  .pipe(autoprefixer({browsers: ['last 2 versions', 'ie >= 9', '> 1%']}))
  .pipe(gulp.dest(paths.normalize.dest, { sourcemaps: '.' }))
  .pipe(notify({message: '<%= file.relative %> compiled and distributed!', title : 'normalizeInit', sound: false}));
}

// Copy bootstrap CSS from node_modules to dist/css
function bsCssInit() {
  return gulp.src(paths.bsCss.src)
    .pipe(gulp.dest(paths.bsCss.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'bsCssInit', sound: false}));
}

// Copy bootstrap JS from node_modules to dist/js
function bsJsInit() {
  return gulp.src(paths.bsJs.src)
    .pipe(gulp.dest(paths.bsJs.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'bsJsInit', sound: false}));
}
/*------------------------------------------------------*/
/* END INIT TASKS --------------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* IMAGE TASKS -----------------------------------------*/
/*------------------------------------------------------*/
// Optimize images and copy to dist/images
function images() {
  return gulp.src(paths.images.src, {since: gulp.lastRun(images)})
		.pipe(imagemin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5,
      svgoPlugins: [{removeViewBox: true}]
    }))
		.pipe(gulp.dest(paths.images.dest))
    .pipe(notify({message: '<%= file.relative %> optimized!', title : 'images', sound: false}));
}
/*------------------------------------------------------*/
/* END IMAGE TASKS -------------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* STYLES TASKS ----------------------------------------*/
/*------------------------------------------------------*/
// Compile custom SCSS to CSS and copy to dist/css
function styles() {
  return gulp.src(paths.styles.src, { sourcemaps: true })
  .pipe(sass({includePaths: ['./node_modules']},{outputStyle: 'compressed'}).on('error', sass.logError))
  .pipe(cleanCSS())
  .pipe(rename({suffix: '.min'}))
  .pipe(autoprefixer({browsers: ['last 2 versions', 'ie >= 9', '> 1%']}))
  .pipe(gulp.dest(paths.styles.dest, { sourcemaps: '.' }))
  .pipe(notify({message: '<%= file.relative %> compiled and distributed!', title : 'styles', sound: false}));
}
/*------------------------------------------------------*/
/* END STYLES TASKS ------------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* SCRIPTS TASKS ---------------------------------------*/
/*------------------------------------------------------*/
// Compile custom JS and copy to dist/js
function scripts() {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(jshint())
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(paths.scripts.dest, { sourcemaps: '.' }))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'))
    .pipe(notify({ message : '<%= file.relative %> minified!', title : "scripts", sound: false}));
}
/*------------------------------------------------------*/
/* END SCRIPTS TASKS -----------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* DNN TASKS -------------------------------------------*/
/*------------------------------------------------------*/
// Copy containers to proper DNN theme containers folder
function containers() {
  return gulp.src(paths.containers.src)
    .pipe(gulp.dest(paths.containers.dest))
    .pipe(notify({message: '<%= file.relative %> distributed!', title : 'containers', sound: false}));
}

// Update manifest.dnn
function manifest() {
  return gulp.src(paths.manifest.src)
    .pipe(replace(/\<package name\=\"(.*?)(?=\")/, '<package name="'+company+ '.' +project))
    .pipe(replace(/type\=\"Skin\" version\=\"(.*?)(?=\")/, 'type="Skin" version="'+version))
    .pipe(replace(/\<friendlyName\>(.*?)(?=\<)/, '<friendlyName>'+project))
    .pipe(replace(/\<description\>(.*?)(?=\<)/, '<description>'+description))
    .pipe(replace(/\<name\>(.*?)(?=\<)/, '<name>'+author))
    .pipe(replace(/\<organization\>(.*?)(?=\<)/, '<organization>'+company))
    .pipe(replace(/\<url\>(.*?)(?=\<)/, '<url>'+url))
    .pipe(replace(/\<email\>(.*?)(?=\<)/, '<email>'+email))
    .pipe(replace(/\<skinName\>(.*?)(?=\<)/, '<skinName>'+project))
    .pipe(replace(/(\\Skins\\)(.*?)(?=\\)/g, '\\Skins\\'+project))
    .pipe(replace(/(\\Containers\\)(.*?)(?=\\)/g, '\\Containers\\'+project))
    .pipe(gulp.dest(paths.manifest.dest))
    .pipe(notify({message: '<%= file.relative %> updated!', title : 'manifest', sound: false}));
}
/*------------------------------------------------------*/
/* END DNN TASKS ---------------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* PACKAGING TASKS -------------------------------------*/
/*------------------------------------------------------*/
// ZIP contents of dist folder
function zipdist() {
  return gulp.src(paths.zipdist.src)
    .pipe(zip(paths.zipdist.zipfile))
    .pipe(gulp.dest(paths.zipdist.dest))
    .pipe(notify({message: '<%= file.relative %> temporarily created!', title : 'zipdist', sound: false}));
}

// ZIP contents of containers folder
function zipcontainers() {
  return gulp.src(paths.zipcontainers.src)
    .pipe(zip(paths.zipcontainers.zipfile))
    .pipe(gulp.dest(paths.zipcontainers.dest))
    .pipe(notify({message: '<%= file.relative %> temporarily created!', title : 'zipcontainers', sound: false}));
}

// ZIP everything else
function zipelse() {
  return gulp.src(paths.zipelse.src, {base: '.'})
    .pipe(gulp.dest(paths.zipelse.dest))
    .pipe(notify({message: '<%= file.relative %> temporarily created!', title : 'zipelse', sound: false}))
    .pipe(replace('dist/', ''))
    .pipe(zip(paths.zipelse.zipfile))
    .pipe(gulp.dest(paths.zipelse.dest))
    .pipe(notify({message: '<%= file.relative %> temporarily created!', title : 'zipelse', sound: false}));
}

// git ziptemp
function ziptemp(done) {
  gulp.series(zipdist, zipcontainers, zipelse)(done);
}

// Assemble files into DNN theme install package
function zippackage() { 
  return gulp.src(paths.zippackage.src)
    .pipe(zip(paths.zippackage.zipfile+'install.zip'))
    .pipe(gulp.dest(paths.zippackage.dest))
    .pipe(notify({message: '<%= file.relative %> created!', title : 'zippackage', sound: false}));
}

// Cleanup temp folder
function cleanup() {
  return gulp.src(paths.cleanup.src)
    .pipe(clean())
    .pipe(notify({message: 'temp folder cleaned up!', title : 'cleanup', sound: false}));
}
/*------------------------------------------------------*/
/* END PACKAGING TASKS ---------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* DEV TASKS -------------------------------------------*/
/*------------------------------------------------------*/
//gulp serve
function serve() {
  bs.init({
      proxy: "nvQuickTheme.loc"
  });
  gulp.watch(paths.images.src, images).on('change', bs.reload);
  gulp.watch(paths.styles.src, styles).on('change', bs.reload);
  gulp.watch(paths.scripts.src, scripts).on('change', bs.reload);
  gulp.watch(paths.containers.src, containers).on('change', bs.reload);
}

// gulp watch
function watch() {
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.containers.src, containers);
}

// gulp init
function init(done) {
  gulp.series(fontsInit, faFontsInit, faCssInit, slimMenuInit, normalizeInit, bsJsInit)(done);
}


// gulp build
function build(done) {
  gulp.series(init, styles, scripts, images, containers, manifest)(done);
}


// gulp package
function package(done) {
  return gulp.series(build, ziptemp, zippackage, cleanup)(done);
}

// gulp packageThemes iterates through schemes in project-details.json
function packageThemes(done) {
  const tasks = schemes.map(schemes => {   
    const csName = schemes.name;
    const csCol = schemes.colors;
    const csFonts = schemes.fonts;
    return gulp.series(
      (csChangeCss) => {    
        return gulp.src(paths.themescheme.src, {base: "./"})
          .pipe(replace(/\@import \'(.*?)(?=\'\;)/, '@import \''+csName))
          .pipe(notify({message: csName + ' css imported!', title : 'theme', sound: false}))
          .pipe(gulp.dest("./"));
          csChangeCss();
      },
      (csChangeCol) => {    
        return gulp.src(paths.colorscheme.src, {base: "./"})
          .pipe(replace(/\$cs-current\: (.*?)(?=\;)/, '$cs-current: $'+csCol))
          .pipe(notify({message: csName + ' colors imported!', title : 'theme', sound: false}))
          .pipe(gulp.dest("./"));
          csChangeCol();
      },
      (csChangeFont) => {    
        return gulp.src(paths.fontscheme.src, {base: "./"})
          .pipe(replace(/\$fs-current\: (.*?)(?=\;)/, '$fs-current: $'+csFonts))
          .pipe(notify({message: csName + ' fonts imported!', title : 'theme', sound: false}))
          .pipe(gulp.dest("./"));
          csChangeFont();
      },
      (csPackage) => {
        return gulp.series(
          (csBuild) => {
            return gulp.series(init, styles, scripts, images, containers, manifest,
              (cbManifest) => {
                return gulp.src(paths.manifest.src)
                  .pipe(replace(/\<package name\=\"(.*?)(?=\")/, '<package name="'+company+'.'+project+'.'+csName))
                  .pipe(replace(/\<friendlyName\>(.*?)(?=\<)/, '<friendlyName>'+project+'-'+csName))
                  .pipe(replace(/\<skinName\>(.*?)(?=\<)/, '<skinName>'+project+'-'+csName))
                  .pipe(replace(/(\\Skins\\)(.*?)(?=\\)/g, '\\Skins\\'+project+'-'+csName))
                  .pipe(replace(/(\\Containers\\)(.*?)(?=\\)/g, '\\Containers\\'+project+'-'+csName))
                  .pipe(gulp.dest(paths.manifest.dest))
                  .pipe(notify({message: '<%= file.relative %> updated with color info!', title : 'manifest', sound: false}));
                  cbManifest();
              })(csBuild);
          }, 
          ziptemp,
          (csZippackage) => {
            return gulp.src(paths.zippackage.src)
            .pipe(zip(paths.zippackage.zipfile+csName+'\_'+'install.zip'))
            .pipe(gulp.dest(paths.zippackage.dest))
            .pipe(notify({message: '<%= file.relative %> created!', title : 'csZippackage', sound: false}));
            csZippackage();
          }, 
          cleanup)
          (csPackage);
      }, 
      (taskDone) => {
        taskDone();
      }
    )
  });
  return gulp.series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}
/*------------------------------------------------------*/
/* END DEV TASKS ---------------------------------------*/
/*------------------------------------------------------*/


/*------------------------------------------------------*/
/* EXPORT TASKS ----------------------------------------*/
/*------------------------------------------------------*/
// You can use CommonJS `exports` module notation to declare tasks
exports.fontsInit = fontsInit;
exports.faFontsInit = faFontsInit;
exports.faCssInit = faCssInit;
exports.slimMenuInit = slimMenuInit;
exports.normalizeInit = normalizeInit;
exports.bsCssInit = bsCssInit;
exports.bsJsInit = bsJsInit;
exports.images = images;
exports.styles = styles;
exports.scripts = scripts;
exports.containers = containers;
exports.manifest = manifest;
exports.zipdist = zipdist;
exports.zipcontainers = zipcontainers;
exports.zipelse = zipelse;
exports.ziptemp = ziptemp;
exports.zippackage = zippackage;
exports.cleanup = cleanup;
exports.serve = serve;
exports.watch = watch;
exports.init = init;
exports.build = build;
exports.package = package;
exports.packageThemes = packageThemes;

// Define default task that can be called by just running `gulp` from cli
exports.default = build;
/*------------------------------------------------------*/
/* END EXPORT TASKS ------------------------------------*/
/*------------------------------------------------------*/
