import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  cpSync,
  statSync,
  createWriteStream,
  rmSync,
} from 'fs';
import { globSync } from 'glob';
import archiver from 'archiver';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { getFileName } from './helpers.js';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectDetails {
  project: string;
  version: string;
  author: string;
  company: string;
  url: string;
  email: string;
  description: string;
}

// ============================================================================
// MANIFEST XML SHAPE
// ============================================================================

interface DnnManifestOwner {
  name: string;
  organization: string;
  url: string;
  email: string;
}

interface DnnManifestComponent {
  '@_type': string;
  skinFiles?: {
    basePath?: string;
    skinName?: string;
  };
  resourceFiles?: {
    basePath?: string;
    resourceFile?: {
      name?: string;
    };
  };
}

interface DnnManifestPackage {
  '@_name': string;
  '@_version': string;
  friendlyName: string;
  description: string;
  owner: DnnManifestOwner;
  components: {
    component: DnnManifestComponent[];
  };
}

interface DnnManifestDoc {
  dotnetnuke: {
    packages: {
      package: DnnManifestPackage;
    };
  };
}

// ============================================================================
// PROJECT DETAILS
// ============================================================================

const details: ProjectDetails = JSON.parse(
  readFileSync('./project-details.json', 'utf-8')
);

export const { project, version, author, company, url, email, description } = details;

// ============================================================================
// ASSET COPY FUNCTIONS
// ============================================================================

/** Copy custom fonts from src/fonts into dist/fonts. */
export function copyFonts(): void {
  const fontsDir = './dist/fonts';
  if (!existsSync(fontsDir)) {
    mkdirSync(fontsDir, { recursive: true });
  }

  const fonts = globSync('./src/fonts/*');
  fonts.forEach((file) => {
    const fileName = getFileName(file);
    cpSync(file, `${fontsDir}/${fileName}`);
  });
  console.log(`${fonts.length} font files copied!`);
}

/** Copy FontAwesome webfonts and CSS into dist. */
export function copyFontAwesome(): void {
  const webfontsDir = './dist/webfonts';
  if (!existsSync(webfontsDir)) {
    mkdirSync(webfontsDir, { recursive: true });
  }

  const faFonts = globSync(
    './node_modules/@fortawesome/fontawesome-free/webfonts/{fa-brands-400.*,fa-solid-900.*,fa-regular-400.*}'
  );
  faFonts.forEach((file) => {
    const fileName = getFileName(file);
    cpSync(file, `${webfontsDir}/${fileName}`);
  });
  console.log(`${faFonts.length} FontAwesome font files copied!`);

  const cssDir = './dist/css';
  if (!existsSync(cssDir)) {
    mkdirSync(cssDir, { recursive: true });
  }

  const faCss: string[] = [
    './node_modules/@fortawesome/fontawesome-free/css/all.min.css',
  ];

  faCss.forEach((file) => {
    if (existsSync(file)) {
      const fileName = getFileName(file);
      cpSync(file, `${cssDir}/${fileName}`);
    }
  });
  console.log('FontAwesome CSS files copied!');
}

/** Copy Bootstrap JS bundle into dist/js. */
export function copyBootstrapJs(): void {
  const jsDir = './dist/js';
  if (!existsSync(jsDir)) {
    mkdirSync(jsDir, { recursive: true });
  }

  const bsFiles = globSync('./node_modules/bootstrap/dist/js/bootstrap.bundle.min.*');
  bsFiles.forEach((file) => {
    const fileName = getFileName(file);
    cpSync(file, `${jsDir}/${fileName}`);
  });
  console.log(`${bsFiles.length} Bootstrap JS files copied!`);
}

/** Copy and flatten images from src/images into dist/images, preserving subdirectories. */
export function processImages(): void {
  const imagesDir = './dist/images';
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  const images = globSync('./src/images/**/*.{jpg,jpeg,png,gif,svg,webp}');
  images.forEach((file) => {
    const relativePath = file.replace('./src/images/', '');
    const destPath = `${imagesDir}/${relativePath}`;
    const destDir = destPath.substring(0, destPath.lastIndexOf('/'));

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    cpSync(file, destPath);
  });
  console.log(`${images.length} images copied!`);
}

/** Copy DNN container files into the Containers directory alongside the theme. */
export function copyContainers(): void {
  const containersDir = `../../Containers/${project}`;
  if (!existsSync(containersDir)) {
    mkdirSync(containersDir, { recursive: true });
  }

  const containers = globSync('./containers/*');
  containers.forEach((file) => {
    const fileName = file.split('/').pop()!;
    cpSync(file, `${containersDir}/${fileName}`);
  });
  console.log(`${containers.length} container files copied!`);
}

/**
 * Generate manifest.dnn by parsing build-resources/manifest.template.dnn as
 * XML (via fast-xml-parser), filling in project metadata directly on the
 * parsed object, and re-serializing it. Writes into the packaging staging
 * directory (temp/) rather than the project root, since the generated
 * manifest is only ever needed inside the final install zip and shouldn't
 * persist anywhere afterward.
 *
 * @param outputDir - Staging directory to write manifest.dnn into (e.g. './temp')
 */
export function updateManifest(outputDir: string): void {
  const templateXml = readFileSync('./build-resources/manifest.template.dnn', 'utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
  });

  const doc = parser.parse(templateXml) as DnnManifestDoc;
  const pkg = doc.dotnetnuke.packages.package;

  // Package identity
  pkg['@_name'] = `${company}.${project}`;
  pkg['@_version'] = version;
  // No dedicated "friendlyName" field exists in project-details.json yet,
  // so this falls back to the project slug (e.g. "nvQuickTheme"). Add a
  // `friendlyName` key to project-details.json and read it here if you
  // want a nicer display name distinct from the folder/skin name.
  pkg.friendlyName = project;
  pkg.description = description;

  // Owner
  pkg.owner.name = author;
  pkg.owner.organization = company;
  pkg.owner.url = url;
  pkg.owner.email = email;

  // Every component (the Skin itself, plus the zipped resource bundles
  // that aren't Containers) installs into the same skin folder.
  const skinBasePath = `Portals\\_default\\Skins\\${project}\\`;

  for (const component of pkg.components.component) {
    if (component['@_type'] === 'Skin' && component.skinFiles) {
      // Each <skinFile>'s path+name is resolved relative to this
      // basePath, so it must point at the skin's own folder — leaving
      // it blank means those files (default.png, thumbnail_default.png)
      // have nowhere to install to.
      component.skinFiles.basePath = skinBasePath;
      component.skinFiles.skinName = project;
    } else if (component['@_type'] === 'ResourceFile' && component.resourceFiles) {
      const resourceName = component.resourceFiles.resourceFile?.name;
      if (resourceName === 'else.zip' || resourceName === 'dist.zip') {
        // Previously blank, which would install these into the portal
        // root instead of the skin's own folder.
        component.resourceFiles.basePath = skinBasePath;
      }
      // cont.zip already has a hardcoded Containers basePath in the
      // template — leave it as-is.
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: false,
  });

  const outputXml = builder.build(doc) as string;

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(`${outputDir}/manifest.dnn`, outputXml);
  console.log('DNN manifest generated from template!');
}

// ============================================================================
// PACKAGING FUNCTIONS
// ============================================================================

type ZipSource = string | string[];

/**
 * Create a zip archive from a glob pattern or an explicit list of file paths.
 *
 * @param src  - A glob string or an array of absolute/relative file paths
 * @param dest - Output path for the resulting zip file
 */
function createZip(src: ZipSource, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);

    if (typeof src === 'string') {
      const files = globSync(src);
      files.forEach((file) => {
        if (statSync(file).isFile()) {
          archive.file(file, { name: file.replace(/^\.\/[^/]+\//, '') });
        }
      });
    } else {
      src.forEach((file) => {
        const fileName = file.replace(/^.*[/\\]/, '');
        archive.file(file, { name: fileName });
      });
    }

    void archive.finalize();
  });
}

/**
 * Zip the contents of ./dist at the zip root (css/, fonts/, images/, js/,
 * webfonts/) with no "dist" folder wrapping them.
 *
 * @param dest - Output path for dist.zip
 */
function createDistZip(dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory('./dist', false);

    void archive.finalize();
  });
}

/**
 * The install package has no "dist" folder, so the "dist/" prefix must be
 * removed from the asset references in these two partials. Only the copies
 * written into else.zip are changed; the source files are left alone.
 */
const DIST_REWRITE_FILES = ['_includes.ascx', '_includes-popUpSkin.ascx'];

/** Remove "dist/" from asset references (e.g. "dist/css/a.css" → "css/a.css"). */
function stripDistRefs(content: string): string {
  return content.replace(/dist\//g, '');
}

/**
 * Build else.zip straight from the project sources (no temp copy), keeping
 * the folder structure DNN expects inside the skin folder:
 *
 *   else.zip
 *   ├── menus/              (entire folder, recursive)
 *   ├── partials/           (entire folder, recursive)
 *   ├── *.ascx              (root skin files, e.g. default.ascx)
 *   ├── koi.json
 *   └── skin.doctype.xml
 *
 * @param dest - Output path for else.zip
 */
function createElseZip(dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);

    // Folders — preserved with their folder name and any subfolders
    for (const folder of ['menus', 'partials']) {
      if (existsSync(`./${folder}`)) {
        // Skip the two partials that get rewritten below
        archive.directory(`./${folder}`, folder, (entry) =>
          folder === 'partials' && DIST_REWRITE_FILES.includes(entry.name) ? false : entry
        );
      } else {
        console.warn(`⚠️ ./${folder} not found — it will be missing from else.zip`);
      }
    }

    // _includes.ascx and _includes-popUpSkin.ascx with "dist/" removed from references
    for (const name of DIST_REWRITE_FILES) {
      const file = `./partials/${name}`;
      if (existsSync(file)) {
        archive.append(stripDistRefs(readFileSync(file, 'utf-8')), { name: `partials/${name}` });
      } else {
        console.warn(`⚠️ ${file} not found — it will be missing from else.zip`);
      }
    }

    // Root-level skin files
    const rootFiles = [
      ...globSync('*.ascx'),
      ...['koi.json', 'skin.doctype.xml'].filter((f) => existsSync(f)),
    ];
    rootFiles.forEach((file) => {
      archive.file(file, { name: file });
    });

    for (const required of ['koi.json', 'skin.doctype.xml']) {
      if (!existsSync(required)) {
        console.warn(`⚠️ ${required} not found in project root — it will be missing from else.zip`);
      }
    }

    void archive.finalize();
  });
}

/**
 * Locate a root-level package file. Looks in the project root first, then in
 * build-resources/ (next to manifest.template.dnn). Throws if it can't be
 * found, because DNN refuses to install the package without these files.
 */
function requirePackageFile(fileName: string): string {
  const candidates = [`./${fileName}`, `./build-resources/${fileName}`];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      `Required package file "${fileName}" not found. Looked in: ${candidates.join(', ')}`
    );
  }
  return found;
}

/**
 * Build and assemble the complete DNN install package zip.
 * Expects Vite to have already produced a dist/ folder.
 */
export function createPackage(): Promise<void> {
  console.log('Creating DNN theme package...');

  const tempDir = './temp';
  const buildDir = './build';

  // Resolve required root files up front so we fail before doing any work.
  const rootPackageFiles = [
    'themeLicense.txt',
    'themeReleaseNotes.txt',
    'default.png',
    'thumbnail_default.png',
  ].map(requirePackageFile);

  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
  }
  mkdirSync(tempDir, { recursive: true });

  if (!existsSync(buildDir)) {
    mkdirSync(buildDir, { recursive: true });
  }

  // Generate the manifest straight into the staging directory — it's only
  // ever needed inside the install zip, so it never touches the project root.
  updateManifest(tempDir);

  return Promise.all([
    createDistZip(`${tempDir}/dist.zip`),
    createZip('./containers/**/*', `${tempDir}/cont.zip`),
    createElseZip(`${tempDir}/else.zip`),
  ])
    .then(() => {
      const files = [
        `${tempDir}/else.zip`,
        `${tempDir}/dist.zip`,
        `${tempDir}/cont.zip`,
        `${tempDir}/manifest.dnn`,
        ...rootPackageFiles,
      ];
      return createZip(files, `${buildDir}/${project}_${version}_install.zip`);
    })
    .then(() => {
      rmSync(tempDir, { recursive: true });
      console.log(`\n✅ Package created: ${buildDir}/${project}_${version}_install.zip\n`);
    });
}