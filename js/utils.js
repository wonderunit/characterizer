Object.equals = function( x, y ) {
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}

function convertMS(ms) {
  var d, h, m, s
  s = Math.floor(ms / 1000)
  m = Math.floor(s / 60)
  s = s % 60
  h = Math.floor(m / 60)
  m = m % 60
  d = Math.floor(h / 24)
  h = h % 24
  return { d: d, h: h, m: m, s: s }
}

function getFriendlyMS(ms) {
  let converted = convertMS(ms)
  converted.h = converted.h < 10 ? '0'+converted.h : converted.h
  converted.m = converted.m < 10 ? '0'+converted.m : converted.m
  converted.s = converted.s < 10 ? '0'+converted.s : converted.s
  return converted
}

function semiRandomShuffle(array, factor) {
  let f=factor
  return array.map((e,i)=>{return [e,i+Math.random()*(f*2-f)]}).sort((a,b)=>{return a[1]-b[1]}).map(e=>{return e[0]})
}

// via https://stackoverflow.com/questions/5723154/truncate-a-string-in-the-middle-with-javascript
//     https://stackoverflow.com/questions/831552/ellipsis-in-the-middle-of-a-text-mac-style/36470401#36470401
const truncateMiddle = (string, maxLength = 30, separator = '…') => {
  if (!string) return string
  if (maxLength < 1) return string
  if (string.length <= maxLength) return string
  if (maxLength == 1) return string.substring(0, 1) + separator

  var midpoint = Math.ceil(string.length / 2)
  var toremove = string.length - maxLength
  var lstrip = Math.ceil(toremove / 2)
  var rstrip = toremove - lstrip

  return string.substring(0, midpoint - lstrip) +
         separator +
         string.substring(midpoint + rstrip)
}

module.exports = {
  convertMS,
  getFriendlyMS,
  semiRandomShuffle,
  truncateMiddle
}