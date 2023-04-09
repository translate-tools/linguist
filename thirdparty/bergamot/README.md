Utils to build a bergamot as WASM module and a bindings to run WASM module in [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker).

The [bergamot project](https://github.com/browsermt/bergamot-translator) is a machine translation that support compiling to a WASM.

## Build

To build bergamot WASM module run `make build`. First build may take about 20 minutes.

Directory `src` contains a code of worker that must be compiled with webpack from project root directory.
