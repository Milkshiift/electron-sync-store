import { type BuildConfig } from "bun";

const defaultOptions: Partial<BuildConfig> = {
    sourcemap: "external",
    minify: true,
    external: ["electron"],
};

console.log("Building...");

await Bun.build({
    ...defaultOptions,
    entrypoints: ["./src/main.ts"],
    outdir: "./dist",
    target: "node",
    naming: "main.js",
});

await Bun.build({
    ...defaultOptions,
    entrypoints: ["./src/preload.ts"],
    outdir: "./dist",
    target: "browser",
    naming: "preload.js",
});

await Bun.build({
    ...defaultOptions,
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    target: "node",
    naming: "index.js",
});

console.log("Generating types...");

const tsc = Bun.spawn(["bun", "tsc", "--emitDeclarationOnly", "--outDir", "./dist"]);
await tsc.exited;

if (tsc.exitCode !== 0) {
    console.error("Type generation failed!");
    console.error(await new Response(tsc.stderr).text());
    process.exit(1);
}

console.log("Build complete! 🚀");