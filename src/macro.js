"use strict";

const { createMacro } = require("babel-plugin-macros");
const path = require("path");

module.exports = createMacro(transform);

function transform({ references, babel: { types: t }, state }) {
  const importSpecifiers = [];

  Object.keys(references).forEach(name => {
    if (references[name].length && name[0].toLowerCase() === name[0]) {
      importSpecifiers.push(
        t.importSpecifier(references[name][0].node, t.identifier(name))
      );
    }
  });

  if (importSpecifiers.length) {
    const importNode = t.importDeclaration(
      importSpecifiers,
      t.stringLiteral(path.resolve(__dirname, "runtime.js"))
    );
    const first = state.file.path.get("body").find(p => p.isStatement());
    if (first) {
      first.insertBefore(importNode);
    } else {
      state.file.path.node.body.unshift(importNode);
    }
  }

  const mangleNames = new Set();
  transformModel(references.model);
  if (mangleNames.size) {
    state.file.ast.leadingComments = state.file.ast.leadingComments || [];
    state.file.ast.leadingComments.unshift({
      type: "LineComment",
      value: `@mangle: ${JSON.stringify(Array.from(mangleNames))}`
    });
  }

  function transformModel(paths) {
    if (!paths || !paths.length) {
      return;
    }

    paths.forEach(modelPath => {
      // model(config)
      if (modelPath.parentPath.isCallExpression()) {
        const configPath = modelPath.parentPath.get("arguments")[0];

        // check config is { ... }
        if (configPath && configPath.isObjectExpression()) {
          configPath.get("properties").forEach(propPath => {
            // check { [key]: { ...} }
            const enableMangle = !propPath.node.computed;
            if (enableMangle) {
              addMangleName(propPath.get("key"));
            }
            if (propPath.get("value").isObjectExpression()) {
              if (
                !propPath.node.computed &&
                propPath.node.key.name === "actions"
              ) {
                propPath.get("value.properties").forEach(prop => {
                  prop.get("value").replaceWith(t.numericLiteral(0));
                });
              } else {
                transformObjectExpression(propPath, enableMangle);
              }
              seperateObjectProperty(propPath);
            }
          });

          let ns = state.filename
            .replace(/^.*?models[/\\]/, "")
            .replace(/(?:\.\.(?:\\+|\/)?)+/g, "")
            .replace(/\\+/g, "/")
            .replace(path.extname(state.filename), "");

          if (modelPath.parentPath.parentPath.isObjectProperty()) {
            ns += "/" + modelPath.parentPath.parent.key.name;
          }

          if (process.env.NODE_ENV !== "production") {
            configPath.node.properties.unshift(
              t.objectProperty(t.identifier("__prefix"), t.stringLiteral(ns))
            );
          }
        }

        function addMangleName(path) {
          if (path.isIdentifier()) {
            mangleNames.add(path.node.name);
          }
        }

        function propertyName(path) {
          return path.isIdentifier() ? path.node.name : undefined;
        }

        function transformFunc(func) {
          const members = {};
          func.traverse({
            ThisExpression(thisPath) {
              let thisScope = thisPath.scope;
              while (
                !thisScope.path.isFunction() ||
                thisScope.path.isArrowFunctionExpression()
              ) {
                thisScope = thisScope.parent;
              }

              if (
                thisScope === func.scope &&
                thisPath.parentPath.isMemberExpression()
              ) {
                const prop = thisPath.parentPath.get("property");
                if (prop.node.computed) {
                  return;
                }

                const name = prop.node.name;
                (members[name] || (members[name] = [])).push(thisPath);
              }
            }
          });

          if (Object.keys(members).length) {
            const model = func.scope.generateUidIdentifier("model");
            func.node.params.unshift(model);

            if (Object.keys(members).some(key => members[key].length > 1)) {
              const destructMapper = Object.keys(members).reduce((map, key) => {
                map[key] = func.scope.generateUidIdentifier(key);
                members[key].forEach(path =>
                  path.parentPath.replaceWith(map[key])
                );
                return map;
              }, {});
              func.node.body.body.unshift(
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.objectPattern(
                      Object.keys(members).map(name =>
                        t.objectProperty(
                          t.identifier(name),
                          destructMapper[name]
                        )
                      )
                    ),
                    model
                  )
                ])
              );
            } else {
              Object.keys(members).forEach(key =>
                members[key].forEach(path => path.replaceWith(model))
              );
            }
          }
        }

        function seperateObjectProperty(propPath) {
          const propValueIdent = modelPath.scope.generateUidIdentifier(
            propertyName(propPath.get("key"))
          );
          modelPath
            .findParent(p => p.isStatement())
            .insertBefore(
              t.variableDeclaration("const", [
                t.variableDeclarator(propValueIdent, propPath.node.value)
              ])
            );
          propPath.get("value").replaceWith(propValueIdent);
        }

        function transformObjectExpression(path, enableMangle) {
          enableMangle = enableMangle && !path.node.computed;
          if (enableMangle) {
            addMangleName(path.get("key"));
          }
          path.get("value.properties").forEach(prop => {
            const localEnableMangle =
              enableMangle &&
              !prop.node.computed &&
              !path.get("key").isIdentifier({ name: "state" });
            if (localEnableMangle) {
              addMangleName(prop.get("key"));
            }
            if (prop.get("value").isFunctionExpression()) {
              transformFunc(prop.get("value"));
              seperateObjectProperty(prop);
            } else if (prop.isObjectMethod()) {
              transformFunc(prop);
              if (prop.node.kind === "method") {
                const propValueIdent = modelPath.scope.generateUidIdentifier(
                  propertyName(prop.get("key"))
                );
                const func = t.functionExpression(
                  prop.get("key").isIdentifier() ? prop.node.key : null,
                  prop.node.params,
                  prop.node.body,
                  prop.node.generator,
                  prop.node.async
                );
                modelPath
                  .findParent(p => p.isStatement())
                  .insertBefore(
                    t.variableDeclaration("const", [
                      t.variableDeclarator(propValueIdent, func)
                    ])
                  );
                prop.replaceWith(
                  t.objectProperty(
                    prop.node.key,
                    propValueIdent,
                    prop.node.computed,
                    false,
                    prop.node.decorators
                  )
                );
              }
            } else if (prop.get("value").isObjectExpression()) {
              prop.get("value.properties").forEach(propPath => {
                // check { [key]: { ...} }
                if (propPath.get("value").isObjectExpression()) {
                  transformObjectExpression(propPath, localEnableMangle);
                  seperateObjectProperty(propPath);
                }
              });
              seperateObjectProperty(prop);
            }
          });
        }
      }
    });
  }
}
