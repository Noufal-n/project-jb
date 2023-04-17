'use strict'

const util = require('util')
const expect = require('chai').expect
const randomNumbers = require('./randomNumbers')

describe('randonNumbers', () => {  
  const testNameTruey = 'is number'
  const randomNumber = randomNumbers.create()
  describe(testNameTruey,  () => {
    it('testing if '+randomNumber+' '+testNameTruey, () => {
      expect(util.isNumber(randomNumber)).to.equal(true)
    });
  });
  const testNameNoteEqualLast = 'is not equal the last'
  const randomNumber2 = randomNumbers.create()
  describe(testNameNoteEqualLast,  () => {
    it('testing if '+randomNumber2+' '+testNameNoteEqualLast+' '+randomNumber, () => {
      expect(randomNumber2).to.not.equal(randomNumber)
    });
  });
});