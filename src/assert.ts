import { promises as fs } from 'fs';
import { strict as strictAssert } from 'assert';
import { types, exists, isMatch } from './utils.js';

const assert: typeof strictAssert & {
  matchRule: typeof matchRule,
  doesNotMatchRule: typeof doesNotMatchRule,
  matchFile: typeof matchFile,
  doesNotMatchFile: typeof doesNotMatchFile
} = Object.assign(strictAssert, { matchRule, doesNotMatchRule, matchFile, doesNotMatchFile });

export { assert };

export type Expected = string | RegExp | object;

/**
 * assert the `actual` is match `expected`
 *  - when `expected` is regexp, detect by `RegExp.test`
 *  - when `expected` is json, detect by `lodash.ismatch`
 *  - when `expected` is string, detect by `String.includes`
 *
 * @param {String|Object} actual - actual string
 * @param {String|RegExp|Object} expected - rule to validate
 */
export function matchRule(actual: string | object | number, expected: Expected) {
  if (types.isRegExp(expected)) {
    assert.match(actual.toString(), expected);
  } else if (types.isObject(expected)) {
    // if pattern is `json`, then convert actual to json and check whether contains pattern
    const content = types.isString(actual) ? JSON.parse(actual) : actual;
    const result = isMatch(content, expected);
    if (!result) {
      // print diff
      throw new assert.AssertionError({
        operator: 'should partial includes',
        actual: content,
        expected,
        stackStartFn: matchRule,
      });
    }
  } else if (actual === undefined || !(actual as string).includes(expected)) {
    throw new assert.AssertionError({
      operator: 'should includes',
      actual,
      expected,
      stackStartFn: matchRule,
    });
  }
}

/**
 * assert the `actual` is not match `expected`
 *  - when `expected` is regexp, detect by `RegExp.test`
 *  - when `expected` is json, detect by `lodash.ismatch`
 *  - when `expected` is string, detect by `String.includes`
 *
 * @param {String|Object} actual - actual string
 * @param {String|RegExp|Object} expected - rule to validate
 */
export function doesNotMatchRule(actual: string | object | number, expected: Expected) {
  if (types.isRegExp(expected)) {
    assert.doesNotMatch(actual.toString(), expected);
  } else if (types.isObject(expected)) {
    // if pattern is `json`, then convert actual to json and check whether contains pattern
    const content = types.isString(actual) ? JSON.parse(actual) : actual;
    const result = isMatch(content, expected);
    if (result) {
      // print diff
      throw new assert.AssertionError({
        operator: 'should not partial includes',
        actual: content,
        expected,
        stackStartFn: doesNotMatchRule,
      });
    }
  } else if (actual === undefined || (actual as string).includes(expected)) {
    throw new assert.AssertionError({
      operator: 'should not includes',
      actual,
      expected,
      stackStartFn: doesNotMatchRule,
    });
  }
}

/**
 * validate file
 *
 *  - `matchFile('/path/to/file')`: check whether file exists
 *  - `matchFile('/path/to/file', /\w+/)`: check whether file match regexp
 *  - `matchFile('/path/to/file', 'usage')`: check whether file includes specified string
 *  - `matchFile('/path/to/file', { version: '1.0.0' })`: checke whether file content partial includes specified JSON
 *
 * @param {string} filePath - target path to validate, could be relative path
 * @param {string|RegExp|Object} [expected] - rule to validate
 * @throws {AssertionError}
 */
export async function matchFile(filePath: string, expected?: Expected): Promise<void> {
  // check whether file exists
  const isExists = await exists(filePath);
  assert(isExists, `Expected ${filePath} to be exists`);

  // compare content, support string/json/regex
  if (expected) {
    const content = await fs.readFile(filePath, 'utf-8');
    try {
      assert.matchRule(content, expected);
    } catch (err) {
      if (err instanceof assert.AssertionError) {
        err.message = `file(${filePath}) with content: ${err.message}`;
      }
      throw err;
    }
  }
}

/**
 * validate file with opposite rule
 *
 *  - `doesNotMatchFile('/path/to/file')`: check whether file don't exists
 *  - `doesNotMatchFile('/path/to/file', /\w+/)`: check whether file don't match regex
 *  - `doesNotMatchFile('/path/to/file', 'usage')`: check whether file don't includes specified string
 *  - `doesNotMatchFile('/path/to/file', { version: '1.0.0' })`: checke whether file content don't partial includes specified JSON
 *
 * @param {string} filePath - target path to validate, could be relative path
 * @param {String|RegExp|Object} [expected] - rule to validate
 * @throws {AssertionError}
 */
export async function doesNotMatchFile(filePath: string, expected?: Expected): Promise<void> {
  // check whether file exists
  const isExists = await exists(filePath);
  if (!expected) {
    assert(!isExists, `Expected ${filePath} to not be exists`);
  } else {
    assert(isExists, `Expected file(${filePath}) not to match \`${expected}\` but file not exists`);
    const content = await fs.readFile(filePath, 'utf-8');
    try {
      assert.doesNotMatchRule(content, expected);
    } catch (err) {
      if (err instanceof assert.AssertionError) {
        err.message = `file(${filePath}) with content: ${err.message}`;
      }
      throw err;
    }
  }
}
