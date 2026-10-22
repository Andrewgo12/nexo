import { formatPropValue } from '../../utils/codeGeneration';

export function injectPropsIntoCode(usageCode, props, defaultProps, componentName, demoOnlyProps = []) {
  if (!usageCode || !props || !componentName) return usageCode;

  const demoOnlySet = new Set(demoOnlyProps);
  const changedProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (demoOnlySet.has(key)) continue;

    if (JSON.stringify(value) !== JSON.stringify(defaultProps[key])) {
      changedProps[key] = value;
    }
  }

  if (Object.keys(changedProps).length === 0) return usageCode;

  let result = usageCode;
  const propsToAdd = [];

  for (const [propName, propValue] of Object.entries(changedProps)) {
    const formattedValue = formatPropValue(propValue, propName);
    const newPropLine =
      typeof propValue === 'boolean' && propValue === true ? propName : `${propName}=${formattedValue}`;

    const simplePropRegex = new RegExp(
      `(^[ \\t]*)(${propName})(?:=(?:"[^"\\n]*"|'[^'\\n]*'|\\{[^{}\\n]*\\}|[^\\s/>]+))?[ \\t]*(\\r?\\n|$)`,
      'gm'
    );

    const hasSimpleMatch = simplePropRegex.test(result);
    simplePropRegex.lastIndex = 0;

    if (hasSimpleMatch) {
      let seen = false;
      result = result.replace(simplePropRegex, (_, indent, __, lineEnding) => {
        if (seen) return '';
        seen = true;
        return `${indent}${newPropLine}${lineEnding}`;
      });
      continue;
    }

    const multiLineStart = new RegExp(`^([ \\t]*)(${propName})=\\{`, 'gm');
    let match;
    let updated = false;

    while ((match = multiLineStart.exec(result)) !== null) {
      const indent = match[1];
      const startIndex = match.index;
      const openBraceIndex = match.index + match[0].length - 1;

      let braceCount = 1;
      let i = openBraceIndex + 1;
      while (i < result.length && braceCount > 0) {
        if (result[i] === '{') braceCount++;
        else if (result[i] === '}') braceCount--;
        i++;
      }

      if (braceCount === 0) {
        const before = result.slice(0, startIndex);
        const after = result.slice(i);
        result = before + indent + newPropLine + after;
        updated = true;
        break;
      }
    }

    if (!updated) {
      propsToAdd.push(newPropLine);
    }
  }

  if (propsToAdd.length > 0) {
    const indentMatch = result.match(/\n([ \t]+)\w/);
    const indent = indentMatch ? indentMatch[1] : '  ';

    const newPropsStr = propsToAdd.map(p => `${indent}${p}`).join('\n');

    const closingIndex = result.lastIndexOf('/>');
    if (closingIndex !== -1) {
      const before = result.slice(0, closingIndex);
      const after = result.slice(closingIndex);
      result = before.trimEnd() + '\n' + newPropsStr + '\n' + after.trim();
    }
  }

  return result;
}
