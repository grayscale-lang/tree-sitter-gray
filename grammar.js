module.exports = grammar({
  name: 'ez',

  extras: $ => [
    /\s/,
    $.comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.struct_literal, $._expression],
    [$.variable_declaration],
    [$.block, $.array_literal],
    [$.expression_statement, $.array_literal],
    [$.named_return, $.type],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.module_declaration,
      $.import_statement,
      $.using_statement,
      $.import_and_use_statement,
      $.variable_declaration,
      $.function_declaration,
      $.struct_declaration,
      $.enum_declaration,
      $.if_statement,
      $.for_statement,
      $.for_each_statement,
      $.as_long_as_statement,
      $.loop_statement,
      $.when_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.ensure_statement,
      $.assignment_statement,
      $.expression_statement,
      $.block,
    ),

    // Module declaration (must be first in file)
    module_declaration: $ => seq(
      'module',
      field('name', $.identifier),
    ),

    // Import statements
    import_statement: $ => seq(
      'import',
      optional(field('alias', $.identifier)),
      choice(
        $.import_path,
        seq($.import_path, repeat(seq(',', $.import_path))),
      ),
    ),

    import_path: $ => choice(
      seq('@', $.identifier),           // @std
      seq('"', /[^"]+/, '"'),           // "path/to/module"
      seq('c', '"', /[^"]+/, '"'),      // c"header.h"
    ),

    using_statement: $ => seq(
      'using',
      $.identifier,
      repeat(seq(',', $.identifier)),
    ),

    import_and_use_statement: $ => seq(
      'import',
      'and',
      'use',
      choice(
        $.import_path,
        seq($.import_path, repeat(seq(',', $.import_path))),
      ),
    ),

    // Variable declaration
    variable_declaration: $ => seq(
      optional('private'),
      choice('mut', 'const'),
      $.identifier,
      optional($.type),
      optional(seq('=', $._expression)),
    ),

    // Function declaration
    function_declaration: $ => seq(
      optional('private'),
      'do',
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      optional(seq('->', $.return_types)),
      $.block,
    ),

    parameter_list: $ => seq(
      $.parameter,
      repeat(seq(',', $.parameter)),
    ),

    parameter: $ => seq(
      optional('&'),
      field('name', $.identifier),
      repeat(seq(',', optional('&'), field('name', $.identifier))),
      field('type', $.type),
      optional(seq('=', $._expression)),
    ),

    return_types: $ => choice(
      $.type,
      seq('(', $.named_return, repeat(seq(',', $.named_return)), ')'),
    ),

    named_return: $ => seq(
      optional(seq(field('name', $.identifier), repeat(seq(',', field('name', $.identifier))))),
      field('type', $.type),
    ),

    // Struct declaration
    struct_declaration: $ => seq(
      repeat($.attribute),
      'const',
      field('name', $.identifier),
      'struct',
      '{',
      repeat(choice($.field_declaration, $.function_declaration)),
      '}',
    ),

    field_declaration: $ => seq(
      field('name', $.identifier),
      field('type', $.type),
    ),

    // Enum declaration
    enum_declaration: $ => seq(
      repeat($.attribute),
      'const',
      field('name', $.identifier),
      'enum',
      '{',
      repeat($.enum_value),
      '}',
    ),

    enum_value: $ => seq(
      $.identifier,
      optional(seq('=', $._expression)),
    ),

    attribute: $ => seq(
      '#',
      field('name', $.identifier),
      optional(seq('(', $._expression, ')')),
    ),

    // Control flow
    if_statement: $ => seq(
      'if',
      $._expression,
      $.block,
      repeat($.or_clause),
      optional($.otherwise_clause),
    ),

    or_clause: $ => seq(
      'or',
      $._expression,
      $.block,
    ),

    otherwise_clause: $ => seq(
      'otherwise',
      $.block,
    ),

    for_statement: $ => seq(
      'for',
      optional('('),
      $.identifier,
      optional($.type),
      'in',
      $._expression,
      optional(')'),
      $.block,
    ),

    for_each_statement: $ => seq(
      'for_each',
      optional('('),
      $.identifier,
      optional(seq(',', $.identifier)),
      optional($.type),
      'in',
      $._expression,
      optional(')'),
      $.block,
    ),

    as_long_as_statement: $ => seq(
      choice('as_long_as', 'while'),
      $._expression,
      $.block,
    ),

    loop_statement: $ => seq(
      'loop',
      $.block,
    ),

    // When statement (switch/match equivalent)
    when_statement: $ => seq(
      repeat($.attribute),
      'when',
      $._expression,
      '{',
      repeat($.is_clause),
      optional($.default_clause),
      '}',
    ),

    is_clause: $ => seq(
      'is',
      $._expression,
      repeat(seq(',', $._expression)),
      $.block,
    ),

    default_clause: $ => seq(
      'default',
      $.block,
    ),

    return_statement: $ => prec.right(seq(
      'return',
      optional(seq($._expression, repeat(seq(',', $._expression)))),
    )),

    break_statement: $ => 'break',

    continue_statement: $ => 'continue',

    // Ensure statement (runs on function exit, like defer)
    ensure_statement: $ => prec(11, seq(
      'ensure',
      $.call_expression,
    )),

    // Assignment
    assignment_statement: $ => seq(
      $._expression,
      choice('=', '+=', '-=', '*=', '/=', '%='),
      $._expression,
    ),

    expression_statement: $ => $._expression,

    block: $ => seq(
      '{',
      repeat($._statement),
      '}',
    ),

    // Expressions
    _expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.raw_string,
      $.char_literal,
      $.boolean,
      $.nil,
      $.array_literal,
      $.map_literal,
      $.struct_literal,
      $.call_expression,
      $.cast_expression,
      $.member_expression,
      $.index_expression,
      $.unary_expression,
      $.postfix_expression,
      $.binary_expression,
      $.grouped_expression,
      $.new_expression,
      $.range_expression,
      $.or_return_expression,
      $.func_ref,
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice(
      $.integer,
      $.float,
    ),

    integer: $ => choice(
      /[0-9][0-9_]*/,
      /0x[0-9a-fA-F_]+/,
      /0b[01_]+/,
      /0o[0-7_]+/,
    ),

    float: $ => /[0-9][0-9_]*\.[0-9][0-9_]*/,

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $.escape_sequence,
        $.interpolation,
      )),
      '"',
    ),

    string_content: $ => /[^"\\$]+/,

    escape_sequence: $ => /\\[nrt\\'"0]|\\x[0-9a-fA-F]{2}/,

    interpolation: $ => seq(
      '${',
      $._expression,
      '}',
    ),

    raw_string: $ => seq(
      '`',
      /[^`]*/,
      '`',
    ),

    char_literal: $ => seq(
      "'",
      choice(/[^'\\]/, $.escape_sequence),
      "'",
    ),

    boolean: $ => choice('true', 'false'),

    nil: $ => 'nil',

    array_literal: $ => seq(
      '{',
      optional(seq($._expression, repeat(seq(',', $._expression)))),
      '}',
    ),

    // {:} is the empty map literal; non-empty maps have key:value entries
    map_literal: $ => seq(
      '{',
      choice(
        seq($.map_entry, repeat(seq(',', $.map_entry))),
        ':',
      ),
      '}',
    ),

    map_entry: $ => seq(
      $._expression,
      ':',
      $._expression,
    ),

    struct_literal: $ => prec.dynamic(1, seq(
      $.identifier,
      '{',
      optional(seq($.struct_field, repeat(seq(',', $.struct_field)))),
      '}',
    )),

    struct_field: $ => seq(
      $.identifier,
      ':',
      $._expression,
    ),

    call_expression: $ => prec(11, seq(
      field('function', $._expression),
      '(',
      optional(seq($._expression, repeat(seq(',', $._expression)))),
      ')',
    )),

    // cast(value, type) or cast(value, [type])
    cast_expression: $ => prec(11, seq(
      'cast',
      '(',
      $._expression,
      ',',
      choice($.array_type, $.type),
      ')',
    )),

    member_expression: $ => prec.left(12, seq(
      $._expression,
      '.',
      field('property', $.identifier),
    )),

    index_expression: $ => prec.left(12, seq(
      $._expression,
      '[',
      $._expression,
      ']',
    )),

    unary_expression: $ => prec.right(10, seq(
      choice('-', '!', 'bit_not'),
      $._expression,
    )),

    postfix_expression: $ => prec.left(13, seq(
      $._expression,
      choice('++', '--', '^'),
    )),

    // Precedence levels match the EZ parser (PREC_OR=1 through PREC_PRODUCT=9)
    binary_expression: $ => choice(
      prec.left(1, seq($._expression, '||',                                    $._expression)),
      prec.left(2, seq($._expression, '&&',                                    $._expression)),
      prec.left(3, seq($._expression, choice('==', '!='),                      $._expression)),
      prec.left(4, seq($._expression, choice('bit_and', 'bit_or', 'bit_xor'), $._expression)),
      prec.left(5, seq($._expression, choice('<', '>', '<=', '>='),            $._expression)),
      prec.left(6, seq($._expression, choice('in', 'not_in'),                  $._expression)),
      prec.left(7, seq($._expression, choice('bit_shift_left', 'bit_shift_right'), $._expression)),
      prec.left(8, seq($._expression, choice('+', '-'),                        $._expression)),
      prec.left(9, seq($._expression, choice('*', '/', '%'),                   $._expression)),
    ),

    grouped_expression: $ => seq('(', $._expression, ')'),

    new_expression: $ => prec.right(seq(
      'new',
      '(',
      field('type', $.identifier),
      ')',
      optional(seq('{', optional(seq($.struct_field, repeat(seq(',', $.struct_field)))), '}')),
    )),

    range_expression: $ => seq(
      'range',
      '(',
      $._expression,
      optional(seq(',', $._expression)),
      optional(seq(',', $._expression)),
      ')',
    ),

    or_return_expression: $ => prec.right(seq(
      $._expression,
      'or_return',
      optional($._expression),
    )),

    func_ref: $ => seq(
      '(',
      ')',
      $.identifier,
    ),

    // Types
    type: $ => choice(
      $.primitive_type,
      $.array_type,
      $.map_type,
      $.pointer_type,
      $.wildcard_type,
      $.identifier,  // user-defined types
    ),

    wildcard_type: $ => '?',

    primitive_type: $ => choice(
      'int', 'i8', 'i16', 'i32', 'i64', 'i128', 'i256',
      'uint', 'u8', 'u16', 'u32', 'u64', 'u128', 'u256',
      'float', 'f32', 'f64',
      'bool', 'char', 'byte', 'string',
      'func',
    ),

    array_type: $ => seq(
      '[',
      $.type,
      optional(seq(',', $.integer)),
      ']',
    ),

    map_type: $ => seq(
      'map',
      '[',
      $.type,
      ':',
      $.type,
      ']',
    ),

    pointer_type: $ => seq(
      '^',
      $.type,
    ),

    // Comments
    comment: $ => /\/\/[^\n]*/,

    block_comment: $ => /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//,
  },
});
