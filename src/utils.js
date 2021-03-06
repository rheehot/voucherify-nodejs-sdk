'use strict'

const crypto = require('crypto')
const { isString, exists } = require('./helpers')

function roundMoney (value) {
  const places = 2
  return +(Math.round(value + 'e+' + places) + 'e-' + places)
}

function validatePercentDiscount (discount) {
  if (!exists(discount) || discount < 0 || discount > 100) {
    throw new Error('Invalid voucher, percent discount should be between 0-100.')
  }
}

function validateAmountDiscount (discount) {
  if (!exists(discount) || discount < 0) {
    throw new Error('Invalid voucher, amount discount must be equal or higher than zero.')
  }
}

function validateUnitDiscount (discount) {
  if (!exists(discount) || discount < 0) {
    throw new Error('Invalid voucher, unit discount must be equal or higher than zero.')
  }
}

module.exports = {
  calculatePrice: function (basePrice, voucher, unitPrice) {
    const e = 100 // Number of digits after the decimal separator.
    let discount

    if (voucher.gift) {
      discount = Math.min(voucher.gift.balance / e, basePrice)
      return roundMoney(basePrice - discount)
    }

    if (!voucher.discount) {
      throw new Error('Unsupported voucher type.')
    }

    if (voucher.discount.type === 'PERCENT') {
      discount = voucher.discount.percent_off
      validatePercentDiscount(discount)
      const priceDiscount = basePrice * (discount / 100)

      return roundMoney(basePrice - priceDiscount)
    } else if (voucher.discount.type === 'AMOUNT') {
      discount = voucher.discount.amount_off
      validateAmountDiscount(discount)
      const newPrice = basePrice - (discount / e)

      return roundMoney(newPrice > 0 ? newPrice : 0)
    } else if (voucher.discount.type === 'UNIT') {
      discount = voucher.discount.unit_off
      validateUnitDiscount(discount)
      const newPrice = basePrice - unitPrice * discount

      return roundMoney(newPrice > 0 ? newPrice : 0)
    } else {
      throw new Error('Unsupported discount type.')
    }
  },

  calculateDiscount: function (basePrice, voucher, unitPrice) {
    const e = 100 // Number of digits after the decimal separator.
    let discount

    if (voucher.gift) {
      discount = Math.min(voucher.gift.balance / e, basePrice)
      return roundMoney(discount)
    }

    if (!voucher.discount) {
      throw new Error('Unsupported voucher type.')
    }

    if (voucher.discount.type === 'PERCENT') {
      discount = voucher.discount.percent_off
      validatePercentDiscount(discount)

      return roundMoney(basePrice * (discount / 100))
    } else if (voucher.discount.type === 'AMOUNT') {
      discount = voucher.discount.amount_off / e
      validateAmountDiscount(discount)
      const newPrice = basePrice - discount

      return roundMoney(newPrice > 0 ? discount : basePrice)
    } else if (voucher.discount.type === 'UNIT') {
      discount = voucher.discount.unit_off
      validateUnitDiscount(discount)
      const priceDiscount = unitPrice * discount

      return roundMoney(priceDiscount > basePrice ? basePrice : priceDiscount)
    } else {
      throw new Error('Unsupported discount type.')
    }
  },

  webhooks: {
    verifySignature: function (signature, message, secretKey) {
      return crypto.createHmac('sha256', secretKey)
        .update(isString(message) ? message : JSON.stringify(message))
        .digest('hex') === signature
    }
  }
}
