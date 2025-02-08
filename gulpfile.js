import gulp from "gulp";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import browserSync from "browser-sync";
import fileinclude from "gulp-file-include";
import uglify from "gulp-uglify";
import concat from "gulp-concat";
import log from "fancy-log";
import colors from "ansi-colors";
import terser from "gulp-terser";
import cleanCSS from "gulp-clean-css";
import htmlmin from "gulp-htmlmin";
import size from "gulp-size";
import { deleteAsync } from "del";
import prettyBytes from "pretty-bytes";
import tailwindcss from "tailwindcss";
import through2 from "through2";

const bs = browserSync.create();

// Environment check
const isProd = process.env.NODE_ENV === "production";

// Utility functions
const noop = () => through2.obj();

// Build logger
const buildLogger = {
  start: (task) => {
    const taskNames = {
      html: "Compiling HTML",
      css: "Processing CSS & Tailwind",
      javascript: "Bundling JavaScript",
      assets: "Copying assets",
    };
    log(colors.cyan.bold(`${taskNames[task] || task}...`));
  },
  end: (task) => {
    const taskNames = {
      html: "HTML compiled",
      css: "CSS processed",
      javascript: "JavaScript bundled",
      assets: "Assets copied",
    };
    log(colors.green.bold(`✓ ${taskNames[task] || task}`));
  },
  error: (task, err) => {
    const taskNames = {
      html: "HTML compilation",
      css: "CSS processing",
      javascript: "JavaScript bundling",
      assets: "Assets copying",
    };
    log.error(
      colors.red.bold(`Error in ${taskNames[task] || task}:`),
      err.message
    );
  },
  info: (message) => {
    log(colors.blue(message));
  },
  size: (task, bytes) => {
    log(colors.gray(`${task} size:`), colors.yellow(prettyBytes(bytes)));
  },
};

// Browser-sync task
function browserSyncServe(cb) {
  bs.init({
    server: {
      baseDir: "./dist",
    },
    notify: false,
  });
  buildLogger.info("🚀 Development server started");
  cb();
}

// Browser-sync reload task
function browserSyncReload(cb) {
  bs.reload();
  buildLogger.info("🔄 Browser reloaded");
  cb();
}

// HTML processing task
function html() {
  buildLogger.start("html");
  return gulp
    .src(["src/pages/**/*.html"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
        context: {
          year: new Date().getFullYear(),
        },
      })
    )
    .pipe(
      isProd
        ? htmlmin({ collapseWhitespace: true, removeComments: true })
        : noop()
    )
    .on("data", function (file) {
      buildLogger.size("HTML", file.contents.length);
    })
    .pipe(gulp.dest("./dist"))
    .pipe(!isProd ? bs.stream() : noop())
    .on("end", () => buildLogger.end("html"))
    .on("error", (err) => buildLogger.error("html", err));
}

// CSS compilation task
function css() {
  buildLogger.start("css");
  const plugins = [
    tailwindcss,
    autoprefixer(),
    isProd ? cssnano() : null,
  ].filter(Boolean);

  return gulp
    .src("./src/assets/css/style.css")
    .pipe(!isProd ? sourcemaps.init() : noop())
    .pipe(postcss(plugins))
    .pipe(isProd ? cleanCSS() : noop())
    .pipe(rename({ suffix: ".min" }))
    .pipe(!isProd ? sourcemaps.write(".") : noop())
    .pipe(size())
    .pipe(gulp.dest("./dist/css"))
    .pipe(!isProd ? bs.stream() : noop())
    .on("end", () => buildLogger.end("css"))
    .on("error", (err) => buildLogger.error("css", err));
}

// JavaScript compilation task
function js() {
  buildLogger.start("javascript");
  return gulp
    .src("./src/assets/js/**/*.js")
    .pipe(!isProd ? sourcemaps.init() : noop())
    .pipe(concat("bundle.min.js"))
    .pipe(isProd ? terser() : uglify())
    .pipe(!isProd ? sourcemaps.write(".") : noop())
    .pipe(size())
    .pipe(gulp.dest("./dist/js"))
    .pipe(!isProd ? bs.stream() : noop())
    .on("end", () => buildLogger.end("javascript"))
    .on("error", (err) => buildLogger.error("javascript", err));
}

// Assets copy task
function copyAssets() {
  buildLogger.start("assets");
  return gulp
    .src(["src/assets/images/**/*"])
    .pipe(gulp.dest("./dist/images"))
    .pipe(bs.stream())
    .on("end", () => buildLogger.end("assets"))
    .on("error", (err) => buildLogger.error("assets", err));
}

// Watch task
function watchFiles() {
  buildLogger.info("\n📦 Starting development build...");
  gulp.watch("./src/assets/css/**/*.css", css);
  gulp.watch("./src/assets/js/**/*.js", js);
  gulp.watch("./src/**/*.html", gulp.series(html, browserSyncReload));
  gulp.watch("./src/assets/images/**/*", copyAssets);
  gulp.watch("./tailwind.config.js", css);
}

// Build complete logger
function buildComplete(cb) {
  const date = new Date();
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )}:${String(date.getSeconds()).padStart(2, "0")}`;

  console.log("\n");
  log(colors.cyan.bold("✨ Build completed successfully!"));
  log(colors.gray("⚡️ Build time:"), colors.yellow(time));

  if (!isProd) {
    log(colors.gray("🔍 Watching for changes..."));
  }

  // Build stats
  log(colors.gray("\nBuild information:"));
  log(
    colors.gray("• Environment:"),
    colors.yellow(isProd ? "Production" : "Development")
  );
  if (!isProd) {
    log(colors.gray("• Server:"), colors.yellow("http://localhost:3000"));
  }
  log(colors.gray("• Public path:"), colors.yellow("./dist"));
  log(
    colors.gray("• Source maps:"),
    colors.yellow(isProd ? "Disabled" : "Enabled")
  );
  log(
    colors.gray("• Minification:"),
    colors.yellow(isProd ? "Enabled" : "Disabled")
  );
  console.log("\n");

  cb();
}

// Production build task
const build = gulp.series(
  clean,
  gulp.parallel(css, js, html, copyAssets),
  buildComplete
);

// Clean dist folder
function clean() {
  return deleteAsync(["dist"]);
}

// Export tasks
export { css, js, html, clean, build, watchFiles as watch };

// Default task
export default gulp.series(
  gulp.parallel(css, js, html, copyAssets),
  browserSyncServe,
  buildComplete,
  watchFiles
);
