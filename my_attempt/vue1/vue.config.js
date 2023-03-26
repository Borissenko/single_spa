// module.exports = {
//   configureWebpack: {
//     externals: ["vue", /^@my1\/.+/]
//   },
// }


module.exports = {
  lintOnSave: false,
  configureWebpack: {
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      disableHostCheck: true
    },
    externals: ["vue", /^@my1\/.+/]
  },
  filenameHashing: false
}