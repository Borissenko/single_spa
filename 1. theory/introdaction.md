# # ТЕОРИЯ

# остается отработать:
in-browser modules for vue-mf
deploy



# команды single-spa, обзор.

>npm init single-spa

>npm run start     //for root, shared, react
>npm run serve     //for vue-mf



# виды модулей
Существует 2 вида модулей:
- in-browser modules
- build-time modules

in-browser modules — это когда импорт и экспорт НЕ компилируются webpack'om, 
а вместо этого обрабатываются в браузере. 

build-time modules - поставляются node_modules и 
компилируются до того, как они коснутся браузера.




# 1. create NO-Layout project.
- Проект содержит root-config/ & MF-folders/.

- Находясь в корневой папке создаем в/у mf
> npm init single-spa

- имя организации задаем во всех mf одинаково(!)
- Когда создаем root-config/, то можем добавить layout
>Layout Engine - Yes


## (1) vue.config.js
- добавляем в каждый mf.

  module.exports = {
    lintOnSave: false,
    configureWebpack: {
      devServer: {
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        disableHostCheck: true,
        sockPort: 8501,                 //<< порт надо поправить(!).
        sockHost: "localhost"
      },
      externals: ["vue", "vue-router", /^@ORG\/.+/]    //<< 'ORG' - надо поправить(!).
    },
    filenameHashing: false
  }

- 'ORG' - это ИМЯ организации,
- Из всего набора полей можно оставить только поле
 externals: []
- ["vue", "vue-router", /^@ORG\/.+/]", надо ПРОВЕРЯТЬ(!) -     
  здесь д.б. прописаны ТОЛЬКО те зависимости, которые задекларированы в importmap(!).
  Иначе данный mf упадет.




## (2) setPublicPath
- добавляем в каждый mf, включая shared, но исключая root-mf.
- для shared - обязательно.

### истиляция
npm i systemjs-webpack-interop

### src/set-public-path.js
import { setPublicPath } from "systemjs-webpack-interop"
setPublicPath("@ORG/navbar")

### монтирование
//src/vue-mf-styleguide.js
//src/main.js

import "./set-public-path"


### НО(!) касаемо img.
в коде прописан относительный путь
<img alt="my" src="../assets/logo.png">

но он начинает искаться 
НЕ как:
<img alt="my" src="http://localhost:8501/img/logo.png">
а как:
<img alt="my" src="http://localhost:8501/js/img/logo.png">

и поэтому img НЕ находиться.
И где logo.png должно лежать - загадка. ))




## (3) .eslintignore
- добавляем в каждый mf.
**/*.js
**/*.vue




# запуск
- Каждый из mf запускается в отдельном окне консоли и на отдельном порту.
- В броузере открываем порт, на котором запустился root-config/ 
> http://localhost:9000/

- Можно проверить работоспособность отдельного mf, запустился ли он,
открыв его в броузере на его порту
> http://localhost:8501



# port for running
## vue.config.js
module.exports = {
  lintOnSave: false,
  configureWebpack: {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*"
      },

      //эти три поля - порой надо убрать, иначе - не билдится.
      //disableHostCheck: true,
      //sockPort: 8501,               <<<
      //sockHost: "localhost",

      //port: 8501                 << NO. Port of running здесь НЕ обозначаем(!).
    },
    externals: ["vue", "vue-router", /^@vue-mf\/.+/]    <<< sharedDependencies, а 'vue-mf' - это ИМЯ организации(!).
  },
  filenameHashing: false
}



## package.json
"serve": "vue-cli-service serve --port 8501",    << YES. Port of running обозначаем здесь(!).





# декларация MF 
- декларируем в //main.js.
- В main.js Vue-экземпляр сразу переводим в MF-экземпляр.

## Basic декларация MF
- то, что под капотом. Не актуально для практики.

const app1 = {
  async bootstrap(props) { 
    console.log("App is initializing!", props)
  },

  async mount(props) {
    const domElementContainer = document.getElementById("my01")               //<< ТОЧКА ВНЕДРЕНИЯ В index.html

    const button = document.createElement("button");
    button.textContent = `Your ${props.age}`;
    button.addEventListener("click", () => alert("Button was clicked"));

    domElementContainer.appendChild(button);
  },

  async unmount(props) {
    const domElementContainer = document.getElementById("my01")
    domElementContainer.innerHTML = ""
  }

  unload(props) {    // Optional
  }
}


## Структура props в app1-методах
const {
  name,        // The name of the application
  singleSpa,   // The singleSpa instance
  mountParcel, // Function for manually mounting
  customProps  //<< Additional custom information, Нр: props.authToken
} = props      // Props are given to every lifecycle

Далее обозначаем target-div в index.html.
<body>
  <div id="my01"></div>
</body>




## Vue-mf
- имя "main" для mf - запретное(!)


### генерируем автоматически 
- через
> npm init single-spa


### Генерация Vue-MF вручную
//https://ru.single-spa.js.org/docs/ecosystem-vue

//src/main.js
import Vue from "vue"
import VueRouter from "vue-router"

import singleSpaVue from "single-spa-vue"
import App from "./App.vue"

const router = new VueRouter({
  mode: "history",
  base: "/",              // << важно(!)
  routes: [
    { path: "/vue", component: Home },
    { path: "/vue/subroute", component: SubRoute },
  ],
})

const vueApp = singleSpaVue({      //singleSpaVue конвертирует Vue-экземпляр в mf-app = {bootstrap, mount, unmount}
  Vue,
  appOptions: {
    el: '#exact-id',              //ставим '#'(!). Это див, в который будет монтироваться Root.vue
    router,
    render(h) {
      return h(App, {             //<< App.vue
        props: {
          authToken: this.authTk,       //authToken поступает в пропс App.vue.
                                        // this.authTk - поступает из:

                                        // registerApplication({     //in root-config/ORG-root-config.js
                                        //   customProps: {
                                        //     authTk: "TOKEN",
                                        //   },
                                        // })
        },
      })
    }
  }
})

// window.home = vueApp       //old technic, для далее агистрации mf в 
export const { bootstrap, mount, unmount, update } = vueApp    //best technic via systemjs-importmap.

Этот экспорт захватывается webpack'om при билде, ТОЛЬКО(!). Ни где больше он не востребован.
А позже, ма получаем доступ к MF через //localhost:8080/js/app.js

Весь mf-js будет фигурировать в файле 
> //localhost:8080/main.js     - НЕТ(!)
> //localhost:8080/js/app.js   << ДА(!)

> this в singleSpaVue({})
- это customProps: {} в registerApplication({}).


### systemjs-importmap for Vue:
"@ORG/mfName": "//localhost:8503/js/app.js"






## React-mf
### Генерация React-MF вручную.
//react1/src/ORG-mfName.js

import * as React from "react";
import * as ReactDOM from "react-dom"
import singleSpaReact from "single-spa-react"
import Root from "./Root"

const reactApp = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  domElementGetter() {                    //  domElementGetter - для react только(!). Можно не указывать, будет по-умолчанию.
    return document.getElementById('exact-id')     // куда будет примонтирован MF
  },
  errorBoundary() {
    return "Settings error"
  }
})

export const { bootstrap, mount, unmount, update } = reactApp


### systemjs-importmap for React:
"@ORG/mfName": "//localhost:8503/ORG-mfName.js"    //Да.


### dependencies for react
- их наличие в package.json НЕ срабатывает. Надо устанавливать системно.

{
 "imports": {
    "react": "https://cdn.jsdelivr.net/npm/react@17.0.1/umd/react.production.min.js",
    "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@17.0.1/umd/react-dom.production.min.js"
 }
}



## timeouts
- можно добавить, можно не париться.

export function bootstrap(props) {...}
export function mount(props) {...}
export function unmount(props) {...}

export const timeouts = {
bootstrap: {
millis: 5000,
dieOnTimeout: true,
warningMillis: 2500,
},
mount: {
millis: 5000,
dieOnTimeout: false,
warningMillis: 2500,
},
unmount: {
millis: 5000,
dieOnTimeout: true,
warningMillis: 2500,
},
unload: {
millis: 5000,
dieOnTimeout: true,
warningMillis: 2500,
},
};





# 2. root-config/
Содержит:
- //ORG-root-config.js, в нем идет РЕГИСТРАЦИЯ всех mf.
- //index.ejs, это аналог index.html.


# root-config/ORG-root-config.js
- в нем регистрируем MF и запускаем интеграцию, а далее
- его вливаем в ./index.ejs

## 1. регистрируем MF.
//root-config/ORG-root-config.js
import {pathToActiveWhen, registerApplication, start} from "single-spa"

registerApplication({
  name: "myMF-1",                    // СМ. Точка монтирования - автоматически генерируемое id.

  app: app1,                                        //без импортирования, когда всё прописано в одном файле
  app: () => import('./file-with-app.js'),         //for lazyLoading.
  app: window.vueApp,                         //old technic
  app: () => System.import("@ORG/home-5"),       // << best technic

  activeWhen: ["/"],             //это НЕ полное совпадение пути, а лишь НАЧАЛО URL.
                                 //т.е. "/" будет проявляться у ВСЕХ роутах.
  activeWhen: pathToActiveWhen("/", true)    //а это - ТОЧНОЕ совпадение пути, а не префикс пути.
  activeWhen: (location) => location.pathname.startsWith('/app2')    // третий аргумент.

  customProps: {             // поступает в bootstrap(props), mount(props), unmount(props) at mf-App.vue.
                            //и является this в singleSpaVue() и singleSpaReact().
    age: '19',
    authTk: 'TOKEN',           // this.authTk - поступает в singleSpaVue()- декларация App.
    authTk_2() {              //like getter
      return 'KOLA'
    }
  },
  customProps: (appName, location) => {               //location - это window.location, большой {}.
    return { authToken: "d83jD63UdZ6RS6f70D0" }
  }
})


или
registerApplication(
  'app2',                                                //name
  () => import('src/app2/main.js'),                      //resource
  (location) => location.pathname.startsWith('/app2'),   //router
  { some: 'value' }                                      //props
)




# activeWhen:
- поле "activeWhen" в registerApplication() root-config/ORG-root-config.js

'/app1'             - start with
'/pathname/#/hash'  - start with too
'/users/:NO_letters/profile'   - :NO_letters in this chunk, only numbers like '/users/1827469/profile'
['/dd', '/ee']                 - что-либо из перечня.




# before start()
- перед запуском можно закачать API.

Promise.all([
  //before start() we can make any AJAX_requests
])
  .then(() => {
    registerApplication({
        name: 'app-one',
        app: () => System.import('@ORG/home-5'),
        activeWhen: location => location.pathname.startsWith('/')
    })
    registerApplication({
        name: 'app-one',
        app: () => System.import('@ORG/navbar-5'),
        activeWhen: location => location.pathname.startsWith('/')
    })

    start()
  })








## 3. root-config/index.ejs
- вливаем в него js из root-config/ORG-root-config.js 

<body>
  <script>
    System.import('@ORG/root-config-5')      //Обязательно!
    // System.import('@ORG/home-5')          //НЕ требуется.
  </script>
</body>


- задаем в нем точку монтирования MF в DOM, если хотим,
- вливаем в него systemjs-importmap.
- далее root-config/ORG-root-config.js монтируется в ./index.ejs




# Точка монтирования MF в root-config/index.ejs
## a) По-умолчанию
- можно ни где НЕ задавать(!),

- можно даже удалить
<div id="single-spa-application:myMF-1"></div>

все примонтируется автоматически в корень <body> в роли ПОСЛЕДНЕГО ребенка.



## b) автоматически генерируемое id,
- id формируется автоматически на основе:
1. name: 'myMF-1',
заданного в  //root-config/ORG-root-config.js при регистрации MF в registerApplication().name  

2. "single-spa-application:" - обязательный системный префикс.

Далее id прописываем в root-config/index.ejs:
  <section class="card1">
    <div id="single-spa-application:myMF-1"></div>
  </section>





## c) кастомное id
Его задаем в:
const vueApp = singleSpaVue({
  Vue,
  appOptions: {
    el: '#exact-id',
  }
})

а далее используем в DOM at root-config/index.ejs:

  <section class="card1">
    <div id="exact-id" class="card1"></div>
  </section>


  
  
## d) Используя layout.
- см. ниже.




# имитация layout'a в NOT-layout проекте
- специального layout'a - НЕ создаем
- .html - можно без директивной разметки для монтирования mf.

- navbar:
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: var(--navbar-width);    /* css var comes from the styleguide */
  z-index: 1000;

- page:
  margin-left: var(--navbar-width);






# 3 create YES-Layout project.
- это TOP_level layout.
- выгодно, когда одновременно присутствует более 2 mf
т.е. когда становиться сложно их упорядочевать.


## 3.1. генерация root-mf
- при генерации root-mf отмечаем опцию "layout"
- TS НЕ добавляем.


## 3.2. дополнительные настройки
- дополнительные настройки -  такие же, как и при NO-Layout project. 
- но и БЕЗ них - работает! ))

См. выше:
- vue.config.js
- setPublicPath
- .eslintignore


## 3.3. root-config/ORG-root-config.js 
- НЕ трогаем. Он - неприкасаемый!
- Он захватывает layout и програматикли вставляет его в <body>.
- Этот файл создается автоматически, и мы никогда и никак его НЕ модифицируем.


## 3.4. mf:
- ни где НЕ регистрируем. Только прописываем его глобальный импорт в importmap'e. См. ниже.
- приписываем место каждого mf в microfrontends-layout.html. См. ниже.
- имя "main" для mf - запретное(!)


## 3.5. root/index.ejs
Прописываем:
<% if (isLocal) { %>
  <script type="systemjs-importmap">
    {
      "imports": {
        "@my5/root-config": "//localhost:9000/my5-root-config.js",
        "@my5/mf_1": "//localhost:8080/js/app.js",
        "@my5/mf_2": "//localhost:8081/js/app.js"
      }
    }
  </script>
<% } %>

Но НЕ прописываем DOM:
<body>
  <div id="single-spa-application:vue-app"></div>
</body>




## 3.6. root/microfrontends-layout.html
Его дальше подключаем в root-config/ORG-root-config.js

- mode="hash|history - the routes should be matched against the Location pathname or hash.
- base="/"  - prefix for route paths
- disableWarnings - console warnings when the elements provided are incorrect.
- containerEl="body" - CSS Selector or HTMLElement that is used as the container for all single-spa dom elements. Defaults to body.

<template>
1. <single-spa-router>

<single-spa-router mode="hash|history" 
                   base="/" 
                   disableWarnings
                   containerEl="body"
>


2. <route>  
- like v-if="router.path === '/profile'"
<route path="/profile"     //<< required, it is path_prefix. Mb like "clients/:id/reports".
         props='{}'         //that will be provided to the application when it is mounted.
>                        //props can be defined differently for the same application on different routes.
  

3. <application>
- for MF
- application можно прописывать в ЛЮБОМ месте <single-spa-router>

  <application name="@my5/mf_1"
               props="{}"          //that will be provided to the application when it is mounted.
  ></application>
  <application name="@my5/mf_2"></application>
</route>


4. redirect
<redirect from="/settings" to="/profile"></redirect>

5. exact
- т.е. у роутера прописан не префикс, а полный путь
<route path="/" exact>
  <application name="@my5/mf_3"></application>
</route>


6. default
- like "v-else", для всех остальных, неконкретизированных роутов.
<route default>
  <h1>404 Not Found</h1>
</route>


7. <fragment>
- to specify a dynamic server-rendered portion of the template.
<fragment name="importmap"></fragment>
<fragment name="head-metadata"></fragment>



8. <assets>
- to specify the location of server-rendered application assets.
<assets></assets>

</single-spa-router>
</template>





## 3.7. root/microfrontend-layout.html компактно
- тоже самое, но компактно.
- <route> можно вкладывать друг в друга(!) и оборачивать в общий div.

//microfrontend-layout.html
<single-spa-router>
  <route path="cart"></route>
  <route path="product-detail/:productId">
    <route path="reviews"></route>
    <route path="images"></route>
    <route default>
      <h1>Привет!</h1>        //<< можно ли здесь использовать дочку????
    </route>
  </route>

  <route default>
    <h1>404 Not Found</h1>
  </route>
</single-spa-router>






## 3.8. CSS for layout
Три способа:

1. src/index.ejs
<head>
  <link rel="stylesheet" type="text/css" href="main.css">            // NO work
  <link rel="stylesheet" type="text/css" href="../assets/main.css">     // NO work

  <style>
    @import 'main.css';      //<< WORK ?

    .general-wrapper {      //<< WORK
      display: flex;
    }
  </style>
</head>



2. root/src/microfrontend-layout.html
  <style>
    @import 'main.css';      //<< NO WORK

    .general-wrapper {      //<< WORK
      display: flex;
    }
  </style>



3. CSS лайаута вставляем в <style> у App.vue какого-либо MF.










# 4. routing
- роуты отдельного mf переключают БРОУЗЕРНЫЙ, ОБЩИЙ url_path.
- Один из mf можно специализировать в роли nav-bar.

## Роутинг в React.
<BrowserRouter basename="/">        //ФИШКА: basename="/"   (!).
  <Link to="/react">React</Link>
  <Link to="/react/about">React</Link>
  <Link to="/react" exact>React</Link>   //ФИШКА: exact, роут не будет срабатывать на /react/id
</BrowserRouter>




## Роутинг во Vue.
Vue.use(VueRouter)

const router = new VueRouter({
  mode: "history",
  base: "/",              // << важно
  routes: [
    { path: "/", exact: true, redirect: "/vue" }      //<< redirect from '/'
    { path: "/vue", component: Home },
    { path: "/vue/subroute", component: SubRoute },
  ],
});

window.vueApp = singleSpaVue({
  Vue,
  appOptions: {
    router,                    //<< Декларация Роутера.
    render(h) {
      return h(Root, {
        props: {
          name: this.name,
        },
      });
    },
  },
})

<router-link to="/angular">Leave to</router-link>




##  rout.push('/settings') - аналоги
> singleSpaNavigate('/settings')

> singleSpa.navigateToUrl('/')

singleSpa.navigateToUrl('/')

singleSpa.navigateToUrl(document.querySelector('a'))

document.querySelector('a')
  .addEventListener(singleSpa.navigateToUrl)







# 5. Системные функции singleSpa.##
//https://ru.single-spa.js.org/docs/api

const mountedAppNames = singleSpa.getMountedApps()   // => ['app1', 'app2', 'navbar']

const appNames = singleSpa.getAppNames()      // => ['app1', 'app2', 'app3', 'navbar']

const status = singleSpa.getAppStatus('app1')   // 'MOUNTED', ...

singleSpa.addErrorHandler(err => {
  console.log(err);
  console.log(err.appOrParcelName);
  console.log(singleSpa.getAppStatus(err.appOrParcelName));
})

window.addEventListener('single-spa:before-routing-event', evt => ... )  (!)







# 6. CSS

# 6a. Глобальное CSS.

## 6a-1. CSS in components/
- CSS, заявленное в компонентах, становиться глобальным и
распостраняется и на другие MF, перетирая друг друга.


## 6a-2. CSS in index.ejs

<html>
  <head>
    <style>       //var-1
    </style>
  </head>

  <style type="text/css">    //var-2
  </style>

  <body>
  </body>
</html>





# 6b. Пути обособления CSS:

## 6b-1. Использовать .module.scc
- стиль применяется только там, где .module.scc импортирован

//myCSS.module.css
.with-border {
  border: 3px solid red;
}

//компонент_реакта.js
import myStyles from "./myCSS.module.css"

<p className={myStyles["with-border"]}>


## 6b-2. use <style scoped> in Vue






# 7. systemjs-importmap.
- он создает глабальную область видимости для всех MF.

## Декларация systemjs-importmap
// root-config/index.ejs
<!DOCTYPE html>
<html lang="en">
<head>
<script type="systemjs-importmap">
  // это ЗАГРУЗКА кода В ГЛОБАЛЬНУЮ ОБЛАСТЬ ВИДИМОСТИ. Но это еще не использование.
  {
    "imports": {
//v-1
    "single-spa": "https://polyglot.microfrontends.app/npm/single-spa@5.9.0/lib/system/single-spa.min.js",
    "react": "https://cdn.jsdelivr.net/npm/react@17.0.1/umd/react.production.min.js",
    "react-dom": "https://polyglot.microfrontends.app/npm/react-dom@17.0.1/umd/react-dom.production.min.js",
    "vue": "https://polyglot.microfrontends.app/npm/vue@2.6.12/dist/vue.min.js",
    "vue-router": "https://polyglot.microfrontends.app/npm/vue-router@3.4.9/dist/vue-router.min.js",
//v-2
      "vue": "https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js",
      "vue-router": "https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js",
      "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5/lib/system/single-spa.min.js",
      //зависимость "vue" теперь доступна во всех MF
      //и больше НЕ требуется добавлять этот пакет в package.json каждого MF. 
      //- не срабатывает. ))

//for Vue, local development 
      "@ORG/home-5": "//localhost:8080/js/app.js",     
      "@ORG/navbar-5": "//localhost:8081/js/app.js",
      "@ORG/root-config-5": "//localhost:9090/ORG-root-config.js"

//for React, local development
      "@ORG/react-5": "//localhost:8503/ORG-mfName.js"   


      // Раньше к MF для его регистрации в registerApplication() at root-config/ORG-root-config.js 
      // мы добирались через window,
      // сейчас - выстовляя localhost-порт диплоя в глобальную область видимости.

      // "@ORG/navbar-5" восстребуется:
      // - для регистрации MF в registerApplication() at root-config/ORG-root-config.js,
      // - для доступа к компонентам и функциям MF.
      // - вливать js-MF в html - НЕ требуется.

//mf, с которым мы сейчас НЕ кодим. Поэтому для локальной разработки качаем его с боевого сервера.
       "@ORG/react-5": 'https://react.microfrontends.app/planets/2717466e748e53143474beb6baa38e3e5320edd7/react-mf-planets.js'

    }
  }
</script>

  // это библиотеки, обеспечивающие некоторые настройки для systemjs-importmap.
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/system.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/extras/amd.js"></script>
</head>

<body>
  <div id="single-spa-application:myMF-1"></div>
  <div id="single-spa-application:myMF-2"></div>

  <script>
    // загружаем код из root-config/ORG-root-config.js, запущенный на "//localhost:9090/main.js".
    // это - ИСПОЛЬЗОВАНИЕ загруженного в глобальную область видимости, загруженного в systemjs-importmap.

    System.import("@ORG/root-config-5")
    //System.import("@ORG/navbar-5") - НЕ требуется.

  </script>
</body>




## Имя глобальной переменной
> '@my5/mf_1'

- my5 - имя организации
- mf_1 - имя MF. НЕ произвольное(!)
Это имя должно быть ТАКИМ ЖЕ(!), как и имя папки с этим mf.






## Использование systemjs-importmap.
- теперь то, что заявлено в глобальной области видимости, в systemjs-importmap,
можно где-либо использовать via System.import("@ORG/home-5").

let HOME = System.import("@ORG/home-5")

HOME = {
  bootstrap,
  mount,
  unmount,
  update
}


### a) При регистрации MF в 07-root-config/index.js
registerApplication({
  name: "navbar",                            //для формирования id.
  app: () => System.import("@ORG/home-5"),    // <<<
  activeWhen: ["/"],
})





### b) System.import('@ORG/home-5')
- доступ к глобал зависимостям в консоли.

await System.import('@ORG/home-5')
await System.import('vue')
await System.import("single-spa")     //=>> все методы single-spa




### c) System.resolve('@ORG/auth')

await System.resolve("@my5/auth")
await System.resolve("@my5/vue2")

получим:
'http://localhost:8082/my5-auth.js'
'http://localhost:8080/js/app.js'           //<< await System.resolve("@my5/vue2")




## Вынос systemjs-importmap наружу
1. Декларация
//root-config/importmap.json
{
  "imports": {
   "single-spa": "https://cdnjs.cloudflare.com/ajax/libs/single-spa/5.3.2/system/single-spa.min.js",
   "vue": "https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js",
   "vue-router": "https://cdn.jsdelivr.net/npm/vue-router@3.0.7/dist/vue-router.min.js",
  }
}


2. Инъекция в root-config/index.ejs
//root-config/index.ejs
<script type="systemjs-importmap"
        src="https://storage.googleapis.com/vue.microfrontends.app/importmap.json"
></script>

или
<% if (process.env.NODE_ENV === 'development') { %>
<script type="systemjs-importmap"
src="/local-importmap.json"
></script>
<% } %>




## Регистрация sharedDependencies в vue.config.js каждого mf.
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
    externals: ["vue", "vue-router", /^@vue-mf\/.+/]   <<< sharedDependencies, а 'vue-mf' - это ИМЯ организации.
 },
 filenameHashing: false
}















# 8.1. SHARE all_another from own_mf
  
## Теория по-шагам:
Использование:
import { BelowNav } from "@ORG/navbar-5"   //импорт Vue-компонента
import { doIt } from "@ORG/navbar-5"       //ипорт функции

Расположение BelowNav - 'navbar/BelowNav.vue',
'@ORG/navbar-5' - это глобал импорт systemjs-importmap,      << источник импорта.
который забирает код из "//localhost:8081/js/app.js" << MF navbar/src/main.js,

поэтому мы должны прописать соответствующие экспорты в
navbar/src/main.js.

Все, что импортируется из "//localhost:8081/js/app.js", из navbar/src/main.js, - 
становиться публичным интерфейсом МОДУЛЯ, 
который далее захватывается systemjs-importmap'ом и выбрасывается в глобальную область видимости.

Содержание публичного интерфейса данного MF можно проверить в консоле
> await System.import('@ORG/navbar-5')


## Итак, 
1. в navbar/src/main.js - заявляем экспорт того, что далее станет публичным интерфейсом модуля.
export { default as BelowNav } from "./components/BelowNav.vue"
export { doIt } from "./App.vue"


2. в "navbar/src/App.vue" - обозначаем экспорт doIt:
<script>
export default {
}
export const doIt = () => '40'
</script>


3. Use it.
- в любом .vue-компоненте
import { doIt } from "@ORG/navbar-5"       //ипорт функции


4. Результат
   "@ORG/navbar-5" - тоже не находится импортом.







# 8.2. Библиотеки для общего кеширования API для всех MF, для Vue.
Ajax-observable
Ajax-subjects







# 8.3 SHARE from proficiency_mf /"in-browser utility module"/
- спец mf for share_resources.
- Работает НЕ только для in-browser modules. Работает для любого типа mf.

Из него мы экспортируем:
- components/
- global.css
- common utils

## Установка модуля
1. npm init single-spa

>in-browser utility module,
> folderName: shared,
> any framework: none,
> orgName: 'ORG',
> projectName: 'shared'


2. //package.json
- декларируем порт запуска
> "start": "webpack serve --port 8500"    //8500 - common practice


3. root-config/src/index.ejs
### прописываем в systemjs-importmap:    
{
  "imports": {
    "@my5/shared": "//localhost:8500/my5-shared.js"
  }
}

### монтируем к common DOM-проекту.
<body>
<script>
  System.import('@my5/shared');        // <<< обязятельно(!)
  System.import('@my5/root-config');
</script>
</body>


4. Устанавливаем systemjs-webpack-interop (!)
## npm i systemjs-webpack-interop -D

## shared/src/set-public-path.js
import { setPublicPath } from "systemjs-webpack-interop"
setPublicPath("@my1/shared")

## orgName-projectName.js
import "./set-public-path"    <<<

export function doIt() {
  return '= KOLA ='
}


5. .eslintignore
**/*.js
**/*.vue


6. //vue.config.js у mf-акцептора.
- Прописываем "общие" ресурсы.
module.exports = {
  configureWebpack: {
    externals: [/^@ORG\/.+/]       //<<< (!)sharedDependencies, где 'ORG' - это ИМЯ организации.
  },
}

Если пишем "externals: ["vue", "vue-router", /^@ORG\/.+/]", то надо проверить -     
здесь д.б. прописаны ТОЛЬКО те зависимости, которые задекларированы в importmap(!).
Иначе данный mf упадет.



7. root-config/src/my5-root-config.js
- Регистрировать модуль в my5-root-config.js via registerApplication() - НЕ нужно.

8. npm run start
9. ПЕРЕЗАПУСКАЕМ(!) root-mf.


## Заявляем экспортируемое:
> orgName-projectName.js
> Всё экспортируемое в файле ORG-my-oct-01.js
> будет доступно в глобальной области видимости(!).

## import "./set-public-path"
- помним прописать этот импорт в начале shared/src/orgName-projectName.js

## 1/ global.css
import "./global.css" 

Далее - НЕ экспортируем.
Работает БЕЗ регистрации где-либо(!, ???)
или - захватывается by webpack.config.js?
orgName-projectName.js

## 2/ components
- не хватает лоадера. 
Поставить не удается.

export { default as PageHeader } from "./component-library/page-header.vue"


## 3/ function
export function getUser() {
  return {name: '=KOLA='}
}


## use it 
import {PageHeader} from '@my5/auth'
import {getUser} from '@my5/auth'

components: { PageHeader },
computed: {
  GET() {
    return getUser()    // << обязательно(!) через computed().
  }
}







# 10a. Как запустить только один MF during Local Development.
- имеем только 1 папку с MF.

В его index.js обычным способом заявлен MF-component.

const app = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  errorBoundary() {
    return "Settings error";
  },
})

export const { bootstrap, mount, unmount } = app


Наши действия:
1. Открываем сайт
https://polyglot.microfrontends.app/

Его ресурс - https://github.com/polyglot-microfrontends/root-config (!) Смотри пример(!)ю

2. Переходим на страницу "Account settings"
3. В консоле запускаем
> localStorage.setItem("devtools", true)

Перезагружаем страницу.

3. Справа-внизу появляется ЖЕЛТАЯ кнопка "Import Map Overrides", кликаем.

4. Выбираем, какой MF мы хотим подменить.
Раз мы находимся на стр "Account settings"
то подменяем @polyglot-mf/account-settings - MF.  БЕЗ слеша вконце(!).

4. Запускаем наш локальный MF
pnpm run start 09-account-settings

Получаем в консоле
<i> [webpack-dev-server] Project is running at http://127.0.0.1:8080/        <<<<<< 01
  <i> [webpack-dev-server] Content not from webpack is served from /home/user/Desktop/singl_SPA/COURSES/MF-fundamentals/microfrontend-fundamentals
    <i> [webpack-dev-server] 404s will fallback to /index.html
      asset main.js 306 KiB [emitted] (name: main) 1 related asset           <<<<<< 02
      asset index.html 232 bytes [emitted]

Наш URL - http://127.0.0.1:8080/main.js

Для убедительности этот URL можно открыть в броузере, получим js-код.


5. Вставляем этот URL для подмены.
Перезагружаем страницу

Кнопка стала красной.
Контент изменился на наш(!).

6. Если в консоле введем
Sistem.resolve('@polyglot-mf/account-settings')
то тоже получим http://127.0.0.1:8080/main.js


        
        
        
# 10b. Второй способ запуска MF изолированно, локальный.
В консоле броузера вводим http://localhost:8080/




# 11. localStorage.setItem("devtools", true)
- Для появления магической кнопки запускаем в консоле броузера 
> localStorage.setItem("devtools", true)




# 12. SSR
// https://ru.single-spa.js.org/docs/ssr-overview




# 13. setPublicPath()
- нужен.
- В каждом mf.

## В каждом mf npm i systemjs-webpack-interop
npm i systemjs-webpack-interop


## //set-public-path.js
import { setPublicPath } from "systemjs-webpack-interop"
setPublicPath("@vue-mf/navbar")

setPublicPath(process.env.REACT_APP_MICROFRONTEND_PUBLIC_PATH)


## //main.js
import "./set-public-path"


## Then
- You should use as the URL for your import map override:
> http://localhost:8080/index.js 

Что-то не понятно...


## ресурсы "systemjs-webpack-interop"
https://snyk.io/advisor/npm-package/systemjs-webpack-interop/functions/systemjs-webpack-interop.setPublicPath
- https://single-spa.js.org/docs/ecosystem-snowpack/








# 14. .circleci
- это CircleCI:
- https://medium.com/breadhead-stories/ci-cd-workflow-65a93a72eef6
- https://rtfm.co.ua/circleci-obzor-continuous-integration-servisa/



# 15. .husky
- run some code during various parts of your git workflow.
  Husky leverages git hooks to allow you to hook into various git events such as
> pre-commit
> pre-push.

Husky works with any project that uses a package.json file.



