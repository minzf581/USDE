const { body, param, validationResult } = require('express-validator');

const validateDeposit = [
  body('amount')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Amount must be between $1 and $1,000,000'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'ach'])
    .withMessage('Invalid payment method'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than $1'),
  body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateDeposit,
  validateWithdrawal
};



