let regexForVersion = /(19|20)\d{2}|[0-9]*\.\S|\d[]/g;

let ex = 'P4D 2021.1'

const versionExtractor = input => {
  return input.match(regexForVersion).join('').toString();
}

console.log(versionExtractor(ex));