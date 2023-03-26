# Особенности проекта.

# resourse
https://github.com/vue-microfrontends



# Common:
имя организации - 'vue-mf'





# setPublicPath()
- нужен.

## //set-public-path.js
import { setPublicPath } from "systemjs-webpack-interop"
setPublicPath("@vue-mf/navbar")

setPublicPath(process.env.REACT_APP_MICROFRONTEND_PUBLIC_PATH)


## //main.js
import "./set-public-path"


## ресурсы "systemjs-webpack-interop"
https://snyk.io/advisor/npm-package/systemjs-webpack-interop/functions/systemjs-webpack-interop.setPublicPath
- https://single-spa.js.org/docs/ecosystem-snowpack/





# package.json:
## поле "name".
"name": "vue-mf-navbar"    //а не "@vue-mf/navbar".

## поле "name" в package.jsonу у root-config/ 
- name вообще НЕ проставлено.

## Переименовать команды запуска на однотипный вариант?
- но надо проверить, не затрагивается ли имя команды в других службах,
в webpack'e и т.д.





# Директивно указан порт для запуска:
## 0. Как НАДО писать порты(!)

//vue.config.js
module.exports = {
  lintOnSave: false,
  configureWebpack: {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      disableHostCheck: true,
      sockPort: 8501,
      sockHost: "localhost"
    }, 
    externals: ["vue", "vue-router", /^@vue-mf\/.+/]
  },
  filenameHashing: false
}


//package.json
"serve": "vue-cli-service serve --port 8501",




## 1. in package.json
"serve": "vue-cli-service serve --port 8501"  (!)

Но только у:
'navbar'      - 8501
'root-config' - 9000  << для 'root-config' обязательно порт прописываем в package.json. У него нет vue.config.js(!).

Для:
'styleguide'  - порт запуска я дописал сам, 8500. Причина аналогичная, как и у 'root-config'.


> В package.json ИЛИ в vue.config.js(!).


## 2. in vue.config.js
- см. ниже.




# vue.config.js(!)
module.exports = {
  lintOnSave: false,
  configureWebpack: {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      disableHostCheck: true,
      sockPort: 8502,            << Port of running
      sockHost: "localhost",     <<
      https: true,               <<
      port: 8502                 << Port of running
    },
    externals: ["vue", "vue-router", /^@vue-mf\/.+/]     <<(!) ~ systemjs-importmap(!)
  },
  filenameHashing: false
}


# root-config/webpack.config.js(!)
- здесь вписано имя проекта.
Надо ПОПРАВИТЬ на свое.




# root-config/src/index.ejs
## "systemjs-importmap"
- 'местного' "systemjs-importmap" - НЕТ, но есть такой:
 
  <script type="systemjs-importmap"              //<< СПОСОБ импорта "systemjs-importmap"(!)
          src="https://storage.googleapis.com/vue.microfrontends.app/importmap.json"
  >
  </script>

## и он закачивает вот такой JSON (!):
{
  "imports": {
  "vue": "https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js",
  "vue-router": "https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js",
  "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.5.1/lib/system/single-spa.min.js",

- //БЕЗ слеша
  "@vue-mf/root-config": "https://vue.microfrontends.app/root-config/685cb799969ab697700620a8663570a87834fdc7/vue-mf-root-config.js",
  "@vue-mf/styleguide": "https://vue.microfrontends.app/styleguide/566ace2deeba4ca56b38fca7fa52d4d89ac32634/vue-mf-styleguide.js",
- 
  "@vue-mf/navbar": "https://vue.microfrontends.app/navbar/01794334ef10fb4059f6658465f42597d24cb9d1/js/app.js",
  "@vue-mf/dogs-dashboard": "https://vue.microfrontends.app/dogs-dashboard/48cef902e48d293e1588320c0d855f7252742ab6/js/app.js",
  "@vue-mf/rate-dogs": "https://vue.microfrontends.app/rate-dogs/f5951b9fe7521f1134394244e239a47929239efb/js/app.js",


- //со слешем(!), и путь - ко всему репозиторию, а не к отдельному файлу(!).
  "@vue-mf/root-config/": "https://vue.microfrontends.app/root-config/685cb799969ab697700620a8663570a87834fdc7/",
  "@vue-mf/styleguide/": "https://vue.microfrontends.app/styleguide/566ace2deeba4ca56b38fca7fa52d4d89ac32634/",
- 
  "@vue-mf/navbar/": "https://vue.microfrontends.app/navbar/01794334ef10fb4059f6658465f42597d24cb9d1/js/",
  "@vue-mf/dogs-dashboard/": "https://vue.microfrontends.app/dogs-dashboard/48cef902e48d293e1588320c0d855f7252742ab6/js/",
  "@vue-mf/rate-dogs/": "https://vue.microfrontends.app/rate-dogs/f5951b9fe7521f1134394244e239a47929239efb/js/"
  }
}


## вариант "systemjs-importmap"-переменной 'со слешем'.
Пичем вариант 'со слешем' - '"@vue-mf/root-config/",
ни где НЕ востребован вроде-как.

> надо посмотреть его состав(!).


## я переделал 'systemjs-importmap' на следующий:
    <script type="systemjs-importmap">
    {
      "imports": {
        "vue": "https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js",
        "vue-router": "https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js",
        "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.5.1/lib/system/single-spa.min.js"
      }
    }

    </script>

    <% if (isLocal) { %>
        <script type="systemjs-importmap">
    {
      "imports": {
        "@vue-mf/root-config/": "//localhost:9000/",
        "@vue-mf/styleguide/": "//localhost:8080/",
        "@vue-mf/navbar/": "//localhost:8081/js/",
        "@vue-mf/dogs-dashboard/": "//localhost:8082/js/",
        "@vue-mf/rate-dogs/": "//localhost:8083/js/",

        "@vue-mf/root-config": "//localhost:9000/vue-mf-root-config.js",
        "@vue-mf/styleguide": "//localhost:8080/vue-mf-styleguide.js",
        "@vue-mf/navbar": "//localhost:8081/js/app.js",
        "@vue-mf/dogs-dashboard": "//localhost:8082/js/app.js",
        "@vue-mf/rate-dogs": "//localhost:8083/js/app.js"
      }
    }
        </script>
    <% } %>







# styleguide/, (in-browser utility module). 
- это in-browser utility module(!)

Из него мы экспортируем:
- components/
- global.css







# shared-dependencies/
- ни куда не подключены,
- не имеют package.json,
- и поэтому НЕ запускаются ни програматикли, ни через терминал.

Он, похоже, нужен для диплоя через CircleCI,
- закидывая туда systemjs-importmap.json с общими зависимостями.





# layout
- специального layout'a - НЕТ
- .html - без директивной разметки для имплантации mf.

- navbar:
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: var(--navbar-width);    /* css var comes from the styleguide */
  z-index: 1000;

- page:
margin-left: var(--navbar-width);




# .circleci
- это CircleCI:
- https://medium.com/breadhead-stories/ci-cd-workflow-65a93a72eef6
- https://rtfm.co.ua/circleci-obzor-continuous-integration-servisa/



# .husky
- run some code during various parts of your git workflow.
Husky leverages git hooks to allow you to hook into various git events such as 
> pre-commit
> pre-push.

Husky works with any project that uses a package.json file.

