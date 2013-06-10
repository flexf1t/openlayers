goog.provide('ol.expression.Parser');

goog.require('goog.asserts');

goog.require('ol.expression.BooleanLiteral');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Identifier');
goog.require('ol.expression.Lexer');
goog.require('ol.expression.Not');
goog.require('ol.expression.NullLiteral');
goog.require('ol.expression.NumericLiteral');
goog.require('ol.expression.StringLiteral');
goog.require('ol.expression.Token');
goog.require('ol.expression.TokenType');



/**
 * Instances of ol.expression.Parser parse a very limited set of ECMAScript
 * expressions (http://www.ecma-international.org/ecma-262/5.1/#sec-11).
 *
 * - Primary Expression (11.1):
 *   - Identifier (e.g. `foo`)
 *   - Literal (e.g. `"some string"` or `42`)
 *   - Grouped (e.g. `(foo)`)
 * - Left-Hand-Side Expression (11.2):
 *   - Property Accessors
 *     - Dot notation only
 *   - Function Calls
 *     - Identifier with arguments only (e.g. `foo(bar, 42)`)
 * - Unary Operators (11.4)
 *   - Logical Not (e.g. `!foo`)
 * - Multiplicitave Operators (11.5)
 * - Additive Operators (11.6)
 * - Relational Operators (11.8)
 *   - <, >, <=, and >= only
 * - Equality Operators (11.9)
 * - Binary Logical Operators (11.11)
 *
 * @constructor
 */
ol.expression.Parser = function() {
};


/**
 * Determine the precedence for the given token.
 *
 * @param {ol.expression.Token} token A token.
 * @return {number} The precedence for the given token.  Higher gets more
 *     precedence.
 * @private
 */
ol.expression.Parser.prototype.binaryPrecedence_ = function(token) {
  var precedence = 0;

  if (token.type !== ol.expression.TokenType.PUNCTUATOR) {
    return precedence;
  }

  switch (token.value) {
    case '||':
      precedence = 1;
      break;

    case '&&':
      precedence = 2;
      break;

    case '|':
      precedence = 3;
      break;

    case '^':
      precedence = 4;
      break;

    case '&':
      precedence = 5;
      break;

    case '==':
    case '!=':
    case '===':
    case '!==':
      precedence = 6;
      break;

    case '<':
    case '>':
    case '<=':
    case '>=':
      precedence = 7;
      break;

    case '<<':
    case '>>':
      precedence = 8;
      break;

    case '+':
    case '-':
      precedence = 9;
      break;

    case '*':
    case '/':
    case '%':
      precedence = 10;
      break;

    default:
      break;
  }

  return precedence;
};


/**
 * Create a binary expression.
 *
 * @param {string} operator Operator.
 * @param {ol.expression.Expression} left Left expression.
 * @param {ol.expression.Expression} right Right expression.
 * @private
 */
ol.expression.Parser.prototype.createBinaryExpression_ = function(operator,
    left, right) {
  throw new Error('Not implemented');
};


/**
 * Create a call expression.
 *
 * @param {ol.expression.Identifier} expr Identifier expression for function.
 * @param {Array.<ol.expression.Expression>} args Arguments array.
 * @private
 */
ol.expression.Parser.prototype.createCallExpression_ = function(expr, args) {
  throw new Error('Not implemented');
};


/**
 * Create an identifier expression.
 *
 * @param {string} name Identifier name.
 * @return {ol.expression.Identifier} Identifier expression.
 * @private
 */
ol.expression.Parser.prototype.createIdentifier_ = function(name) {
  return new ol.expression.Identifier(name);
};


/**
 * Create a literal expression.
 *
 * @param {string|number|boolean|null} value Literal value.
 * @return {ol.expression.StringLiteral|ol.expression.NumericLiteral|
 *          ol.expression.BooleanLiteral|ol.expression.NullLiteral} The
 *     expression.
 * @private
 */
ol.expression.Parser.prototype.createLiteral_ = function(value) {
  var expr;
  if (goog.isString(value)) {
    expr = new ol.expression.StringLiteral(value);
  } else if (goog.isNumber(value)) {
    expr = new ol.expression.NumericLiteral(value);
  } else if (goog.isBoolean(value)) {
    expr = new ol.expression.BooleanLiteral(value);
  } else {
    goog.asserts.assert(goog.isNull(value));
    expr = new ol.expression.NullLiteral();
  }
  return expr;
};


/**
 * Create a member expression.
 *
 * // TODO: make exp {ol.expression.Member|ol.expression.Identifier}
 * @param {ol.expression.Expression} expr Expression.
 * @param {ol.expression.Identifier} property Member name.
 * @private
 */
ol.expression.Parser.prototype.createMemberExpression_ = function(expr,
    property) {
  throw new Error('Not implemented');
};


/**
 * Create a unary expression.
 *
 * @param {string} op Operator.
 * @param {ol.expression.Expression} expr Expression.
 * @return {ol.expression.Not} The logical not of the input expression.
 * @private
 */
ol.expression.Parser.prototype.createUnaryExpression_ = function(op, expr) {
  goog.asserts.assert(op === '!');
  return new ol.expression.Not(expr);
};


/**
 * Parse an expression.
 *
 * @param {string} source Expression source.
 * @return {ol.expression.Expression} Expression.
 */
ol.expression.Parser.prototype.parse = function(source) {
  var lexer = new ol.expression.Lexer(source);
  return this.parseExpression_(lexer);
};


/**
 * Parse call arguments
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2.4
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {Array.<ol.expression.Expression>} Arguments.
 * @private
 */
ol.expression.Parser.prototype.parseArguments_ = function(lexer) {
  var args = [];

  lexer.expect('(');

  while (!lexer.match(')')) {
    args.push(this.parseBinaryExpression_(lexer));
    if (lexer.match(')')) {
      break;
    }
    lexer.expect(',');
  }
  lexer.skip();

  return args;
};


/**
 * Parse a binary expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.11
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseBinaryExpression_ = function(lexer) {
  var left = this.parseUnaryExpression_(lexer);

  var operator = lexer.peek();
  var precedence = this.binaryPrecedence_(operator);
  if (precedence === 0) {
    // not a binary operator
    return left;
  }
  lexer.skip();

  var right = this.parseUnaryExpression_(lexer);
  var stack = [left, operator, right];

  operator = lexer.peek();
  precedence = this.binaryPrecedence_(operator);
  while (precedence > 0) {
    // TODO: cache operator precedence in stack
    while (stack.length > 2 &&
        (precedence <= this.binaryPrecedence_(stack[stack.length - 2]))) {
      right = stack.pop();
      operator = stack.pop();
      left = stack.pop();
      stack.push(this.createBinaryExpression_(operator.value, left, right));
    }
    lexer.skip();
    operator = lexer.peek();
    precedence = this.binaryPrecedence_(operator);
    stack.push(operator);
    stack.push(this.parseUnaryExpression_(lexer));
  }

  var i = stack.length - 1;
  var expr = stack[i];
  while (i > 1) {
    expr = this.createBinaryExpression_(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }

  return expr;
};


/**
 * Parse a group expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.6
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseGroupExpression_ = function(lexer) {
  lexer.expect('(');
  var expr = this.parseExpression_(lexer);
  lexer.expect(')');
  return expr;
};


/**
 * Parse left-hand-side expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseLeftHandSideExpression_ = function(lexer) {
  var expr = this.parsePrimaryExpression_(lexer);
  var token = lexer.peek();
  if (token.value === '(') {
    // only allow calls on identifiers (e.g. `foo()` not `foo.bar()`)
    if (!(expr instanceof ol.expression.Identifier)) {
      // TODO: token.index
      // TODO: more helpful error messages for restricted syntax
      throw new Error('Unexpected token: (');
    }
    var args = this.parseArguments_(lexer);
    expr = this.createCallExpression_(expr, args);
  } else {
    // TODO: throw if not Identifier
    while (token.value === '.') {
      var property = this.parseNonComputedMember_(lexer);
      expr = this.createMemberExpression_(expr, property);
    }
  }
  return expr;
};


/**
 * Parse non-computed member.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.2
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Identifier} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseNonComputedMember_ = function(lexer) {
  lexer.expect('.');

  var token = lexer.next();
  if (token.type !== ol.expression.TokenType.IDENTIFIER &&
      token.type !== ol.expression.TokenType.KEYWORD &&
      token.type !== ol.expression.TokenType.BOOLEAN_LITERAL &&
      token.type !== ol.expression.TokenType.NULL_LITERAL) {
    // TODO: token.index
    throw new Error('Unexpected token: ' + token.value);
  }

  return this.createIdentifier_(String(token.value));
};


/**
 * Parse primary expression.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.1
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parsePrimaryExpression_ = function(lexer) {
  var token = lexer.peek();
  if (token.value === '(') {
    return this.parseGroupExpression_(lexer);
  }
  lexer.skip();
  var expr;
  var type = token.type;
  if (type === ol.expression.TokenType.IDENTIFIER) {
    expr = this.createIdentifier_(/** @type {string} */ (token.value));
  } else if (type === ol.expression.TokenType.STRING_LITERAL ||
      type === ol.expression.TokenType.NUMERIC_LITERAL ||
      type === ol.expression.TokenType.BOOLEAN_LITERAL ||
      type === ol.expression.TokenType.NULL_LITERAL) {
    expr = this.createLiteral_(token.value);
  } else {
    throw new Error('Unexpected token: ' + token.value);
  }
  return expr;
};


/**
 * Parse expression with a unary operator.
 * http://www.ecma-international.org/ecma-262/5.1/#sec-11.4
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseUnaryExpression_ = function(lexer) {
  var expr;
  var operator = lexer.peek();
  if (operator.type !== ol.expression.TokenType.PUNCTUATOR) {
    expr = this.parseLeftHandSideExpression_(lexer);
  } else if (operator.value === '!') {
    lexer.skip();
    expr = this.parseUnaryExpression_(lexer);
    expr = this.createUnaryExpression_('!', expr);
  } else {
    // TODO: add token.index
    throw new Error('Unexpected token: ' + operator.value);
  }
  return expr;
};


/**
 * Parse an expression.
 *
 * @param {ol.expression.Lexer} lexer Lexer.
 * @return {ol.expression.Expression} Expression.
 * @private
 */
ol.expression.Parser.prototype.parseExpression_ = function(lexer) {
  return this.parseBinaryExpression_(lexer);
};
