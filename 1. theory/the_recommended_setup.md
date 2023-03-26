//https://single-spa.js.org/docs/recommended-setup/#in-browser-versus-build-time-modules


# Виды модулей:
- in-browser modules
- build-time modules

in-browser modules — это когда импорт и экспорт НЕ компилируются webpack'om,
а вместо этого обрабатываются в браузере.

build-time modules - поставляются node_modules и
компилируются до того, как они коснутся браузера.



# The Recommended Setup
We recommend a setup that uses in-browser ES modules + import maps











