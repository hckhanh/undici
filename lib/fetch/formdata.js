'use strict'

const { isBlobLike, toUSVString, makeIterator } = require('./util')
const { kState } = require('./symbols')
const { File, FileLike, isFileLike } = require('./file')
const { webidl } = require('./webidl')
const { Blob } = require('buffer')

// https://xhr.spec.whatwg.org/#formdata
class FormData {
  static name = 'FormData'

  constructor (form) {
    if (arguments.length > 0 && form != null) {
      webidl.errors.conversionFailed({
        prefix: 'FormData constructor',
        argument: 'Argument 1',
        types: ['null']
      })
    }

    this[kState] = []
  }

  append (name, value, filename = undefined) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'append' on 'FormData': 2 arguments required, but only ${arguments.length} present.`
      )
    }

    if (arguments.length === 3 && !isBlobLike(value)) {
      throw new TypeError(
        "Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'"
      )
    }

    // 1. Let value be value if given; otherwise blobValue.

    name = webidl.converters.USVString(name)
    value = isBlobLike(value)
      ? webidl.converters.Blob(value, { strict: false })
      : webidl.converters.USVString(value)
    filename = arguments.length === 3
      ? webidl.converters.USVString(filename)
      : undefined

    // 2. Let entry be the result of creating an entry with
    // name, value, and filename if given.
    const entry = makeEntry(name, value, filename)

    // 3. Append entry to this’s entry list.
    this[kState].push(entry)
  }

  delete (name) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'delete' on 'FormData': 1 arguments required, but only ${arguments.length} present.`
      )
    }

    name = webidl.converters.USVString(name)

    // The delete(name) method steps are to remove all entries whose name
    // is name from this’s entry list.
    const next = []
    for (const entry of this[kState]) {
      if (entry.name !== name) {
        next.push(entry)
      }
    }

    this[kState] = next
  }

  get (name) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'get' on 'FormData': 1 arguments required, but only ${arguments.length} present.`
      )
    }

    name = webidl.converters.USVString(name)

    // 1. If there is no entry whose name is name in this’s entry list,
    // then return null.
    const idx = this[kState].findIndex((entry) => entry.name === name)
    if (idx === -1) {
      return null
    }

    // 2. Return the value of the first entry whose name is name from
    // this’s entry list.
    return this[kState][idx].value
  }

  getAll (name) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'getAll' on 'FormData': 1 arguments required, but only ${arguments.length} present.`
      )
    }

    name = webidl.converters.USVString(name)

    // 1. If there is no entry whose name is name in this’s entry list,
    // then return the empty list.
    // 2. Return the values of all entries whose name is name, in order,
    // from this’s entry list.
    return this[kState]
      .filter((entry) => entry.name === name)
      .map((entry) => entry.value)
  }

  has (name) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'has' on 'FormData': 1 arguments required, but only ${arguments.length} present.`
      )
    }

    name = webidl.converters.USVString(name)

    // The has(name) method steps are to return true if there is an entry
    // whose name is name in this’s entry list; otherwise false.
    return this[kState].findIndex((entry) => entry.name === name) !== -1
  }

  set (name, value, filename = undefined) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 2) {
      throw new TypeError(
        `Failed to execute 'set' on 'FormData': 2 arguments required, but only ${arguments.length} present.`
      )
    }

    if (arguments.length === 3 && !isBlobLike(value)) {
      throw new TypeError(
        "Failed to execute 'set' on 'FormData': parameter 2 is not of type 'Blob'"
      )
    }

    // The set(name, value) and set(name, blobValue, filename) method steps
    // are:

    // 1. Let value be value if given; otherwise blobValue.

    name = webidl.converters.USVString(name)
    value = isBlobLike(value)
      ? webidl.converters.Blob(value, { strict: false })
      : webidl.converters.USVString(value)
    filename = arguments.length === 3
      ? toUSVString(filename)
      : undefined

    // 2. Let entry be the result of creating an entry with name, value, and
    // filename if given.
    const entry = makeEntry(name, value, filename)

    // 3. If there are entries in this’s entry list whose name is name, then
    // replace the first such entry with entry and remove the others.
    const idx = this[kState].findIndex((entry) => entry.name === name)
    if (idx !== -1) {
      this[kState] = [
        ...this[kState].slice(0, idx),
        entry,
        ...this[kState].slice(idx + 1).filter((entry) => entry.name !== name)
      ]
    } else {
      // 4. Otherwise, append entry to this’s entry list.
      this[kState].push(entry)
    }
  }

  get [Symbol.toStringTag] () {
    return this.constructor.name
  }

  entries () {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    return makeIterator(
      () => this[kState].map(pair => [pair.name, pair.value]),
      'FormData',
      'key+value'
    )
  }

  keys () {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    return makeIterator(
      () => this[kState].map(pair => [pair.name, pair.value]),
      'FormData',
      'key'
    )
  }

  values () {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    return makeIterator(
      () => this[kState].map(pair => [pair.name, pair.value]),
      'FormData',
      'value'
    )
  }

  /**
   * @param {(value: string, key: string, self: FormData) => void} callbackFn
   * @param {unknown} thisArg
   */
  forEach (callbackFn, thisArg = globalThis) {
    if (!(this instanceof FormData)) {
      throw new TypeError('Illegal invocation')
    }

    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'forEach' on 'FormData': 1 argument required, but only ${arguments.length} present.`
      )
    }

    if (typeof callbackFn !== 'function') {
      throw new TypeError(
        "Failed to execute 'forEach' on 'FormData': parameter 1 is not of type 'Function'."
      )
    }

    for (const [key, value] of this) {
      callbackFn.apply(thisArg, [value, key, this])
    }
  }
}

FormData.prototype[Symbol.iterator] = FormData.prototype.entries

/**
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#create-an-entry
 * @param {string} name
 * @param {string|Blob} value
 * @param {?string} filename
 * @returns
 */
function makeEntry (name, value, filename) {
  // 1. Set name to the result of converting name into a scalar value string.
  // "To convert a string into a scalar value string, replace any surrogates
  //  with U+FFFD."
  // see: https://nodejs.org/dist/latest-v18.x/docs/api/buffer.html#buftostringencoding-start-end
  name = Buffer.from(name).toString('utf8')

  // 2. If value is a string, then set value to the result of converting
  //    value into a scalar value string.
  if (typeof value === 'string') {
    value = Buffer.from(value).toString('utf8')
  } else {
    // 3. Otherwise:

    // 1. If value is not a File object, then set value to a new File object,
    //    representing the same bytes, whose name attribute value is "blob"
    if (!isFileLike(value)) {
      value = value instanceof Blob
        ? new File([value], 'blob', { type: value.type })
        : new FileLike(value, 'blob', { type: value.type })
    }

    // 2. If filename is given, then set value to a new File object,
    //    representing the same bytes, whose name attribute is filename.
    if (filename !== undefined) {
      value = value instanceof File
        ? new File([value], filename, { type: value.type })
        : new FileLike(value, filename, { type: value.type })
    }
  }

  // 4. Return an entry whose name is name and whose value is value.
  return { name, value }
}

module.exports = { FormData }
