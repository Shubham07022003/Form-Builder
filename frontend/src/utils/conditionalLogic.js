
export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const { logic, conditions } = rules;

  const conditionResults = conditions.map(condition => {
    const { questionKey, operator, value } = condition;
    const answerValue = answersSoFar[questionKey];

    if (answerValue === undefined || answerValue === null) {
      return false;
    }

    switch (operator) {
      case 'equals':
        return String(answerValue) === String(value);
      
      case 'notEquals':
        return String(answerValue) !== String(value);
      
      case 'contains':
        // For arrays (multi-select), check if value is in array
        if (Array.isArray(answerValue)) {
          return answerValue.includes(value) || answerValue.some(item => String(item) === String(value));
        }
        // For strings, check if value is contained
        return String(answerValue).toLowerCase().includes(String(value).toLowerCase());
      
      default:
        return false;
    }
  });

  if (logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (logic === 'OR') {
    return conditionResults.some(result => result === true);
  }

  return true;
}

