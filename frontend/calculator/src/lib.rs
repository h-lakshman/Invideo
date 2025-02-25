use js_sys::Error;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate(expression: &str) -> Result<f64, JsValue> {
    match evaluate_expression(expression) {
        Ok(result) => Ok(result),
        Err(msg) => Err(Error::new(&msg).into()),
    }
}

fn evaluate_expression(expr: &str) -> Result<f64, String> {
    let expr = expr.replace(" ", "");

    let mut chars = expr.chars().peekable();
    parse_expression(&mut chars)
}

fn parse_expression<I>(chars: &mut std::iter::Peekable<I>) -> Result<f64, String>
where
    I: Iterator<Item = char>,
{
    let mut left = parse_term(chars)?;

    while let Some(&c) = chars.peek() {
        if c == '+' {
            chars.next();
            let right = parse_term(chars)?;
            left += right;
        } else if c == '-' {
            chars.next();
            let right = parse_term(chars)?;
            left -= right;
        } else {
            break;
        }
    }

    Ok(left)
}

fn parse_term<I>(chars: &mut std::iter::Peekable<I>) -> Result<f64, String>
where
    I: Iterator<Item = char>,
{
    let mut left = parse_factor(chars)?;

    while let Some(&c) = chars.peek() {
        if c == '*' {
            chars.next();
            let right = parse_factor(chars)?;
            left *= right;
        } else if c == '/' {
            chars.next();
            let right = parse_factor(chars)?;
            if right == 0.0 {
                return Err("Division by zero".to_string());
            }
            left /= right;
        } else {
            break;
        }
    }

    Ok(left)
}

fn parse_factor<I>(chars: &mut std::iter::Peekable<I>) -> Result<f64, String>
where
    I: Iterator<Item = char>,
{
    if let Some(&c) = chars.peek() {
        if c == '(' {
            chars.next();
            let result = parse_expression(chars)?;

            if chars.next() != Some(')') {
                return Err("Missing closing parenthesis".to_string());
            }

            return Ok(result);
        } else if c.is_digit(10) || c == '.' {
            return parse_number(chars);
        } else if c == '-' {
            chars.next();
            let factor = parse_factor(chars)?;
            return Ok(-factor);
        }
    }

    Err("Unexpected token or end of expression".to_string())
}

fn parse_number<I>(chars: &mut std::iter::Peekable<I>) -> Result<f64, String>
where
    I: Iterator<Item = char>,
{
    let mut num_str = String::new();
    let mut has_decimal = false;

    while let Some(&c) = chars.peek() {
        if c.is_digit(10) {
            num_str.push(c);
            chars.next();
        } else if c == '.' && !has_decimal {
            has_decimal = true;
            num_str.push(c);
            chars.next();
        } else {
            break;
        }
    }

    num_str
        .parse::<f64>()
        .map_err(|_| "Invalid number".to_string())
}
