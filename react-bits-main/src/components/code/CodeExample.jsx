import { useMemo } from 'react';
import { getLanguage } from '../../utils/utils';
import { useComponentPropsContext } from '../../hooks/useComponentPropsContext';
import CliInstallation from './CliInstallation';
import CodeHighlighter, { CodeCopyButton } from './CodeHighlighter';
import CodeOptions, { CSS, Tailwind, TSCSS, TSTailwind } from './CodeOptions';
import CodeSection from './CodeSection';
import { injectPropsIntoCode } from './injectPropsIntoCode';

const SKIP_KEYS = new Set(['tailwind', 'css', 'tsTailwind', 'tsCode', 'dependencies']);

const CodeExample = ({ codeObject, componentName }) => {
  const { tailwind, css, tsTailwind, tsCode, code, usage, dependencies } = codeObject;
  const { props, hasChanges, demoOnlyProps, computedProps } = useComponentPropsContext();

  const dynamicUsage = useMemo(() => {
    if (!usage || !componentName || !props || Object.keys(props).length === 0) return usage;

    const mergedProps = { ...props, ...computedProps };
    return injectPropsIntoCode(usage, mergedProps, {}, componentName, demoOnlyProps);
  }, [usage, props, computedProps, componentName, demoOnlyProps]);

  const renderCssSection = () =>
    css && (
      <CodeSection title="CSS" actions={<CodeCopyButton codeString={css} />}>
        <CodeHighlighter snippetId="css" language="css" codeString={css} showCopyButton={false} />
      </CodeSection>
    );

  return (
    <>
      <CliInstallation deps={dependencies} />

      {dynamicUsage && (
        <CodeSection
          title="Usage"
          note={hasChanges ? 'With your settings' : null}
          actions={<CodeCopyButton codeString={dynamicUsage} />}
        >
          <CodeHighlighter
            snippetId="usage"
            language="jsx"
            codeString={dynamicUsage}
            showCopyButton={false}
          />
        </CodeSection>
      )}

      {Object.entries(codeObject).map(([name, snippet]) => {
        if (SKIP_KEYS.has(name)) return null;
        if (name === 'usage') return null;

        if (name === 'code' || name === 'tsCode') {
          return (
            <div key={name}>
              <CodeOptions>
                {tailwind && (
                  <Tailwind>
                    <CodeHighlighter
                      snippetId="code"
                      language="jsx"
                      codeString={tailwind}
                      showCopyButton={false}
                    />
                  </Tailwind>
                )}
                {code && (
                  <CSS>
                    <CodeHighlighter snippetId="code" language="jsx" codeString={code} showCopyButton={false} />
                    {css && renderCssSection()}
                  </CSS>
                )}
                {tsTailwind && (
                  <TSTailwind>
                    <CodeHighlighter
                      snippetId="code"
                      language="tsx"
                      codeString={tsTailwind}
                      showCopyButton={false}
                    />
                  </TSTailwind>
                )}
                {tsCode && (
                  <TSCSS>
                    <CodeHighlighter snippetId="code" language="tsx" codeString={tsCode} showCopyButton={false} />
                    {renderCssSection()}
                  </TSCSS>
                )}
              </CodeOptions>
            </div>
          );
        }

        return (
          <CodeSection key={name} title={name} actions={<CodeCopyButton codeString={snippet} />}>
            <CodeHighlighter
              snippetId={name}
              language={getLanguage(name)}
              codeString={snippet}
              showCopyButton={false}
            />
          </CodeSection>
        );
      })}
    </>
  );
};

export default CodeExample;
