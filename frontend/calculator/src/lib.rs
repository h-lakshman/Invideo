use js_sys::Error;
use wasm_bindgen::prelude::*;

pub fn calculate(expression: &str) -> Result<f64, String> {
    evaluate_expression(expression)
}

#[wasm_bindgen]
pub fn calculate_wasm(expression: &str) -> Result<f64, JsValue> {
    match calculate(expression) {
        Ok(result) => Ok(result),
        Err(msg) => Err(Error::new(&msg).into()),
    }
}

fn evaluate_expression(expr: &str) -> Result<f64, String> {
    let expr = expr.replace(" ", "");
    if expr.is_empty() {
        return Err("Empty expression".to_string());
    }

    let mut chars = expr.chars().peekable();
    let result = parse_expression(&mut chars)?;

    if chars.peek().is_some() {
        return Err("Invalid expression".to_string());
    }

    Ok(result)
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
    match chars.peek() {
        Some(&c) => {
            if c == '(' {
                chars.next();
                let result = parse_expression(chars)?;

                match chars.next() {
                    Some(')') => Ok(result),
                    _ => Err("Missing closing parenthesis".to_string()),
                }
            } else if c.is_digit(10) || c == '.' {
                parse_number(chars)
            } else if c == '-' {
                chars.next();
                let factor = parse_factor(chars)?;
                Ok(-factor)
            } else {
                Err("Unexpected token or end of expression".to_string())
            }
        }
        None => Err("Unexpected end of expression".to_string()),
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_arithmetic() {
        assert_eq!(calculate("2 + 2").unwrap(), 4.0);
        assert_eq!(calculate("3 - 1").unwrap(), 2.0);
        assert_eq!(calculate("4 * 5").unwrap(), 20.0);
        assert_eq!(calculate("10 / 2").unwrap(), 5.0);
    }

    #[test]
    fn test_operator_precedence() {
        assert_eq!(calculate("2 + 3 * 4").unwrap(), 14.0);
        assert_eq!(calculate("10 - 2 * 3").unwrap(), 4.0);
        assert_eq!(calculate("(2 + 3) * 4").unwrap(), 20.0);
        assert_eq!(calculate("10 / (2 + 3)").unwrap(), 2.0);
    }

    #[test]
    fn test_negative_numbers() {
        assert_eq!(calculate("-5 + 3").unwrap(), -2.0);
        assert_eq!(calculate("2 * -4").unwrap(), -8.0);
        assert_eq!(calculate("(-3 + 4) * 2").unwrap(), 2.0);
    }

    #[test]
    fn test_decimal_numbers() {
        assert_eq!(calculate("1.5 + 2.5").unwrap(), 4.0);
        assert_eq!(calculate("3.0 * 1.5").unwrap(), 4.5);
        assert_eq!(calculate("5.0 / 2.0").unwrap(), 2.5);
    }

    #[test]
    fn test_invalid_expressions() {
        let result = calculate("2 +");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Unexpected end of expression");

        let result = calculate("+ 2");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Unexpected token or end of expression");

        let result = calculate("2 + (3");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Missing closing parenthesis");

        let result = calculate("2 + 3)");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid expression");

        let result = calculate("2 + a");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Unexpected token or end of expression");
    }
}
