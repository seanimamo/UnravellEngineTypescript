
/**
* Encodes and decodes numbers into lexographically sortable strings. 
* This especially is useful with dynamodb so that numbers can be used in string based sort keys (because dynamo uses lexographic sorting on string sort keys)
* 
* source: https://medium.com/@neunhoef/sorting-number-strings-numerically-335863473b76
*/
export abstract class LexographicNumberEncoder {
    private static encodeNonNegativeNumber(s: string, pad: string): string {
        let l = s.length;
        if (l <= 92) {
          return String.fromCodePoint(33 + l) + pad + s;
        }
        return '~' + this.encodeNonNegativeNumber(l.toString(10), '') + ' ' + s;
      }
    
      private static translate(s: string) {
        let r = [];
        for (let i = 0; i < s.length; ++i) {
          let c = s.charCodeAt(i);
          r.push(c === 32 ? ' ' : String.fromCodePoint(159 - c));
        }
        return r.join('');
      }
    
      // encodeNonNegativeNumberToLexographic, translateLexographicNumber, encodeLong are used to enable numbers to be sorted lexographically.
      // https://medium.com/@neunhoef/sorting-number-strings-numerically-335863473b76
      static encodeLong(s: string): string {
        if (s.includes('.')) {
            const floatParts = s.split('.');
            if (floatParts.length > 2) {
                throw Error('Encountered unexpected decimal format with multiple "."')
            }

            return this.encodeLong(floatParts[0]) + "." + this.encodeLong(floatParts[1]);
        }
        if (s[0] !== '-') { return this.encodeNonNegativeNumber(s, ' ')}
        let p = this.encodeNonNegativeNumber(s.slice(1), ' ');
        return "-" + this.translate(p!);
      }
    
      private static decodeNonNegativeNumber(s: string) {
        return s.slice(s.indexOf(" ")+1);
      }
    
      static decodeLong(s: string) {
        if (s[0] !== '-') { return this.decodeNonNegativeNumber(s)};
        let p = this.decodeNonNegativeNumber(this.translate(s.slice(1)));
        return "-" + p;
      }
}