# Random Numbers

Create random numbers easily.

```js
const randomNumbers = require('random-numbers')
const randomEvenNumbers = require('random-even-numbers')
const randomOddNumbers = require('random-odd-numbers')

console.log('random', randomNumbers.create())
console.log('random', randomNumbers.create(1,10))
console.log('random', randomNumbers.create(99, 36489))
console.log('random', randomEvenNumbers.create(90, 36489))
console.log('random', randomOddNumbers.create(90, 36489))
```