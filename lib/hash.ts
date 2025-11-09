// A small runtime wrapper that prefers the pure-JS `bcryptjs` implementation
// to avoid native builds on low-RAM builders. You can override by setting
// USE_BCRYPTJS=0 to force native `bcrypt` if you really need it.
const useBcryptJs = process.env.USE_BCRYPTJS !== "0";

let impl: any;
try {
  if (useBcryptJs) {
    // bcryptjs provides a JS-only implementation (no native compile)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    impl = require("bcryptjs");
  } else {
    // Avoid static analysis resolving `require('bcrypt')` when bcrypt is not installed
    // by using an indirect require call. This prevents bundlers from trying to
    // include native `bcrypt` during builds when it's intentionally omitted.
    // eslint-disable-next-line no-eval, @typescript-eslint/no-implied-eval
    const indirectRequire: NodeRequire = eval("require");
    impl = indirectRequire("bcrypt");
  }
} catch (err) {
  // Fallback to bcryptjs if preferred package is not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  impl = require("bcryptjs");
}

export const hash = (value: string, rounds = 10): Promise<string> => {
  return impl.hash(value, rounds);
};

export const compare = (value: string, hashStr: string): Promise<boolean> => {
  return impl.compare(value, hashStr);
};

export default { hash, compare };
